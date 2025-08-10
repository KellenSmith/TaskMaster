"use server";
import GlobalConstants from "../GlobalConstants";
import { headers } from "next/headers";
import { getOrderById, updateOrderStatus } from "./order-actions";
import { Order, OrderStatus } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import {
    getNewOrderStatus,
    PaymentOrderResponse,
    PaymentState,
    TransactionType,
} from "./payment-utils";
import { defaultDatagridActionState, defaultFormActionState, FormActionState } from "./definitions";

const makeSwedbankApiRequest = async (url: string, body?: any) => {
    return await fetch(url, {
        method: body ? "POST" : "GET",
        headers: {
            "Content-Type": "application/json;version=3.1",
            Authorization: `Bearer ${process.env.SWEDBANK_PAY_ACCESS_TOKEN}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
};

// Helper function to generate unique payee references
const generatePayeeReference = (orderId: string, prefix: string = "PAY"): string => {
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, "");
    const timestamp = Date.now().toString().slice(-10);
    // Add some randomness to prevent collisions in rapid succession
    const random = Math.random().toString(36).substring(2, 5); // 3 chars
    const baseRef = `${prefix}${cleanOrderId.slice(0, 13)}${timestamp}${random}`; // 3+13+10+3=29 chars max
    return baseRef.substring(0, 30); // Ensure max length compliance
};

const getSwedbankPaymentRequestPayload = async (orderId: string) => {
    // Find order by ID
    const orderResult = await getOrderById(defaultDatagridActionState, orderId);
    if (orderResult.status !== 200 || !orderResult.result || orderResult.result.length === 0) {
        throw new Error("Order not found");
    }
    const order: Order = orderResult.result[0];
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown";

    // Create a compliant payeeReference: alphanumeric, max 30 chars, unique per payment attempt
    const payeeRef = generatePayeeReference(orderId, "PAY");

    console.log(`Generated payeeReference for order ${orderId}: ${payeeRef}`);

    // Check if this payeeRef is already used by another order
    const existingOrder = await prisma.order.findFirst({
        where: {
            payeeRef: payeeRef,
            id: { not: orderId }, // Exclude the current order
        },
    });

    if (existingOrder) {
        console.error(
            `DUPLICATE PAYEE REFERENCE DETECTED! ${payeeRef} is already used by order ${existingOrder.id}`,
        );
        // Generate a new one with additional entropy
        const fallbackPayeeRef = `${payeeRef}${Math.random().toString(36).substring(2, 5)}`;
        console.log(`Using fallback payeeReference: ${fallbackPayeeRef}`);
        const finalPayeeRef = fallbackPayeeRef.substring(0, 30); // Ensure max length

        try {
            await prisma.order.update({
                where: { id: orderId },
                data: { payeeRef: finalPayeeRef },
            });
            console.log(
                `Successfully stored fallback payeeReference ${finalPayeeRef} for order ${orderId}`,
            );

            return {
                // ...existing payment order structure with finalPayeeRef
                paymentorder: {
                    operation: "Purchase",
                    currency: "SEK",
                    amount: order.totalAmount * 100,
                    vatAmount: 0,
                    description: `Purchase`,
                    userAgent,
                    language: "en-US",
                    urls: {
                        hostUrls: [`${process.env.VERCEL_URL}`],
                        completeUrl: `${process.env.VERCEL_URL}/${GlobalConstants.ORDER}/complete?orderId=${orderId}`,
                        cancelUrl: `${process.env.VERCEL_URL}/${GlobalConstants.ORDER}/complete?orderId=${orderId}`,
                        callbackUrl: `${process.env.VERCEL_URL}/api/payment-callback?orderId=${orderId}`,
                    },
                    payeeInfo: {
                        payeeId: process.env.SWEDBANK_PAY_PAYEE_ID,
                        payeeReference: finalPayeeRef,
                        payeeName: process.env.NEXT_PUBLIC_ORG_NAME,
                        orderReference: orderId,
                    },
                },
            };
        } catch (error) {
            console.error(`Failed to store fallback payeeReference for order ${orderId}:`, error);
            throw new Error(
                "Failed to update order with fallback payee reference: " + error.message,
            );
        }
    }

    try {
        // Update order with payeeRef
        await prisma.order.update({
            where: { id: orderId },
            data: { payeeRef },
        });
        console.log(`Successfully stored payeeReference ${payeeRef} for order ${orderId}`);
    } catch (error) {
        console.error(`Failed to store payeeReference for order ${orderId}:`, error);
        throw new Error("Failed to update order with payee reference: " + error.message);
    }

    return {
        paymentorder: {
            operation: "Purchase",
            currency: "SEK",
            amount: order.totalAmount * 100, // Convert to smallest currency unit
            vatAmount: 0,
            description: `Purchase`,
            userAgent,
            language: "en-US",
            urls: {
                hostUrls: [`${process.env.VERCEL_URL}`],
                completeUrl: `${process.env.VERCEL_URL}/${GlobalConstants.ORDER}/complete?orderId=${orderId}`,
                cancelUrl: `${process.env.VERCEL_URL}/${GlobalConstants.ORDER}/complete?orderId=${orderId}`,
                callbackUrl: `${process.env.VERCEL_URL}/api/payment-callback?orderId=${orderId}`,
                // TODO
                // logoUrl: "https://example.com/logo.png",
                // termsOfServiceUrl: "https://example.com/termsandconditions.pdf",
            },
            payeeInfo: {
                payeeId: process.env.SWEDBANK_PAY_PAYEE_ID,
                payeeReference: payeeRef, // Compliant: alphanumeric, max 30 chars, unique
                payeeName: process.env.NEXT_PUBLIC_ORG_NAME,
                orderReference: orderId, // Your internal order reference (can contain hyphens)
            },
        },
    };
};

export const getPaymentRedirectUrl = async (
    currentActionState: FormActionState,
    orderId: string,
): Promise<FormActionState> => {
    const newActionState: FormActionState = { ...currentActionState };
    try {
        const requestBody = await getSwedbankPaymentRequestPayload(orderId);
        if (!requestBody) throw new Error("Failed to create payment request");

        const response = await makeSwedbankApiRequest(
            `https://api.externalintegration.payex.com/psp/paymentorders`,
            requestBody,
        );

        if (!response.ok) {
            throw new Error("Failed to create payment request");
        }

        const responseData: PaymentOrderResponse = await response.json();
        const redirectOperation = responseData.operations.find(
            (op) => op.rel === "redirect-checkout",
        );

        if (!redirectOperation || !redirectOperation.href) {
            throw new Error("Redirect URL not found in payment response");
        }

        // Save payment order ID to the order to check status later
        try {
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentRequestId: responseData.paymentOrder.id,
                },
            });
        } catch (error) {
            throw new Error("Failed to update order with payment request ID: " + error.message);
        }

        newActionState.status = 200;
        newActionState.result = redirectOperation.href;
        newActionState.errorMsg = "";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg =
            error instanceof Error ? error.message : "An unexpected error occurred";
        newActionState.result = "";
    }
    return newActionState;
};

export const capturePaymentFunds = async (order: Order) => {
    // Use the same payeeReference that was used for the original authorization
    // This maintains the connection between authorization and capture operations
    console.log(`Order details for capture:`, {
        orderId: order.id,
        payeeRef: order.payeeRef,
        paymentRequestId: order.paymentRequestId,
        status: order.status,
    });

    if (!order.payeeRef) {
        console.error(
            `CRITICAL: Order ${order.id} has no payeeRef stored! This will cause conflicts.`,
        );
        throw new Error(`Order ${order.id} is missing payeeRef - cannot capture payment safely`);
    }

    // Create a unique capture reference by appending "CAPTURE" to the original payeeRef
    // This ensures each capture attempt has a unique reference while maintaining traceability
    const capturePayeeRef = `${order.payeeRef}CAP`.substring(0, 30);

    console.log(
        `Attempting to capture payment for order ${order.id} with capture payeeReference: ${capturePayeeRef} (original: ${order.payeeRef})`,
    );

    const capturePaymentResponse = await makeSwedbankApiRequest(
        `https://api.externalintegration.payex.com${order.paymentRequestId}/captures`,
        {
            transaction: {
                description: "Capturing authorized payment",
                amount: order.totalAmount * 100, // Convert to smallest currency unit
                vatAmount: 0,
                payeeReference: capturePayeeRef, // Unique reference for capture operation
            },
        },
    );

    if (!capturePaymentResponse.ok) {
        const errorText = await capturePaymentResponse.text();
        console.error(
            `Failed to capture payment funds for order ${order.id}:`,
            capturePaymentResponse.status,
            capturePaymentResponse.statusText,
            errorText,
        );

        // If we get a conflict error, it might be a duplicate capture attempt
        if (capturePaymentResponse.status === 409) {
            console.warn(
                `Conflict detected for order ${order.id} - this may be a duplicate capture attempt`,
            );
        }

        throw new Error(
            `Payment capture failed: ${capturePaymentResponse.status} ${capturePaymentResponse.statusText}`,
        );
    }

    const responseText = await capturePaymentResponse.text();
    console.log(`Successfully captured payment for order ${order.id}:`, responseText);
    return responseText;
};

export const checkPaymentStatus = async (
    orderId: string,
    currentActionState: FormActionState,
): Promise<FormActionState> => {
    const newActionState: FormActionState = { ...currentActionState };
    const orderResult = await getOrderById(defaultDatagridActionState, orderId);
    if (orderResult.status !== 200 || !orderResult.result || orderResult.result.length === 0) {
        newActionState.status = 400;
        newActionState.result = "";
        newActionState.errorMsg = "Payment request ID not found for this order";
        return newActionState;
    }
    const order = orderResult.result[0];
    const paymentRequestId = order.paymentRequestId;

    if (!paymentRequestId) {
        newActionState.status = 400;
        newActionState.result = "";
        newActionState.errorMsg = "Payment request ID not found for this order";
        return newActionState;
    }

    const paymentStatusResponse = await makeSwedbankApiRequest(
        `https://api.externalintegration.payex.com${paymentRequestId}?$expand=paid`,
    );
    if (!paymentStatusResponse.ok) {
        newActionState.status = paymentStatusResponse.status;
        newActionState.result = "";
        newActionState.errorMsg = "Failed to check payment status";
        return newActionState;
    }
    const paymentStatusData: PaymentOrderResponse = await paymentStatusResponse.json();
    const paymentStatus = paymentStatusData.paymentOrder.status;
    const newOrderStatus = getNewOrderStatus(paymentStatus);

    const updateOrderStatusResult = await updateOrderStatus(
        orderId,
        defaultFormActionState,
        newOrderStatus,
    );

    if (
        paymentStatusData.paymentOrder.paid.transactionType === TransactionType.Authorization &&
        newOrderStatus === OrderStatus.paid &&
        updateOrderStatusResult.status === 200
    ) {
        // Capture payment funds immediately while order is in 'paid' status
        // The updateOrderStatus function will process the order and update it to 'completed'
        try {
            console.log(
                `Order ${orderId} is paid and needs capture. Current status after update: ${newOrderStatus}`,
            );
            await capturePaymentFunds(order);
            console.log(`Successfully captured payment for order ${orderId}`);
        } catch (error) {
            console.error(`Failed to capture payment for order ${orderId}:`, error);
            // Don't throw the error here - the payment was successful, capture can be retried later
            // The order processing in updateOrderStatus will continue normally
        }
    }

    return updateOrderStatusResult;
};

// Debugging function to check for duplicate payeeReference values
export const checkForDuplicatePayeeReferences = async () => {
    const duplicates = await prisma.order.groupBy({
        by: ["payeeRef"],
        having: {
            payeeRef: {
                _count: {
                    gt: 1,
                },
            },
        },
        _count: {
            payeeRef: true,
        },
    });

    if (duplicates.length > 0) {
        console.error("DUPLICATE PAYEE REFERENCES FOUND:", duplicates);

        for (const duplicate of duplicates) {
            const orders = await prisma.order.findMany({
                where: { payeeRef: duplicate.payeeRef },
                select: { id: true, payeeRef: true, createdAt: true, status: true },
            });
            console.error(`PayeeRef ${duplicate.payeeRef} is used by orders:`, orders);
        }
    } else {
        console.log("No duplicate payeeReference values found");
    }

    return duplicates;
};
