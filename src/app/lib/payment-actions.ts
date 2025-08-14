"use server";
import GlobalConstants from "../GlobalConstants";
import { headers } from "next/headers";
import { getOrderById, updateOrderStatus } from "./order-actions";
import { Order, OrderStatus } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { getNewOrderStatus, PaymentOrderResponse, TransactionType } from "./payment-utils";
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
    let payeeRef = generatePayeeReference(orderId, "PAY");

    // Check if this payeeRef is already used by another order
    const existingOrder = await prisma.order.findFirst({
        where: {
            payeeRef: payeeRef,
            id: { not: orderId }, // Exclude the current order
        },
    });

    if (existingOrder) {
        // Generate a new one with additional entropy
        const fallbackPayeeRef = `${payeeRef}${Math.random().toString(36).substring(2, 5)}`;
        payeeRef = fallbackPayeeRef.substring(0, 30); // Ensure max length
    }

    try {
        // Update order with payeeRef
        await prisma.order.update({
            where: { id: orderId },
            data: { payeeRef },
        });
    } catch (error) {
        throw new Error(
            `Failed to update order with payee reference ${payeeRef}: ` + error.message,
        );
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

    if (!order.payeeRef) {
        throw new Error(`Order ${order.id} is missing payeeRef - cannot capture payment safely`);
    }

    // Create a unique capture reference by appending "CAPTURE" to the original payeeRef
    // This ensures each capture attempt has a unique reference while maintaining traceability
    const capturePayeeRef = `${order.payeeRef}CAP`.substring(0, 30);

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
        throw new Error(
            `Payment capture failed: ${capturePaymentResponse.status} ${capturePaymentResponse.statusText}`,
        );
    }

    const responseText = await capturePaymentResponse.text();
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

    if (order.status === OrderStatus.completed) {
        newActionState.status = 200;
        newActionState.result = "";
        newActionState.errorMsg = "Order completed";
        return newActionState;
    }
    // If the order is free, complete it immediately.
    if (order.totalAmount === 0) {
        const updateFreeOrderStatusResult = await updateOrderStatus(
            orderId,
            defaultFormActionState,
            OrderStatus.paid,
        );
        if (updateFreeOrderStatusResult.status === 200)
            return await updateOrderStatus(orderId, defaultFormActionState, OrderStatus.completed);
    }

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

    // Initialize completeOrderResult with the status update result
    let completeOrderResult = { ...updateOrderStatusResult };

    // If the order was successfully updated to paid status, handle payment capture if needed
    if (updateOrderStatusResult.status === 200 && newOrderStatus === OrderStatus.paid) {
        const updatedOrder = await getOrderById(defaultDatagridActionState, orderId);

        if (updatedOrder.status === 200 && updatedOrder.result && updatedOrder.result.length > 0) {
            const currentOrder = updatedOrder.result[0];

            // Handle payment capture for authorization transactions
            if (
                paymentStatusData.paymentOrder.paid.transactionType ===
                TransactionType.Authorization
            ) {
                try {
                    await capturePaymentFunds(order);
                } catch {
                    // Don't throw the error here - the payment was successful, capture can be retried later
                    // The order processing will continue normally
                }
            }
            if (currentOrder.status === OrderStatus.shipped) {
                completeOrderResult = await updateOrderStatus(
                    orderId,
                    defaultFormActionState,
                    OrderStatus.completed,
                );
            }
        }
    }

    return completeOrderResult;
};
