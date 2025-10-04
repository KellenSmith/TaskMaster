"use server";
import GlobalConstants from "../GlobalConstants";
import { headers } from "next/headers";
import { getOrderById, progressOrder } from "./order-actions";
import { Language, OrderStatus } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import {
    getNewOrderStatus,
    PaymentOrderResponse,
    SubscriptionToken,
    TransactionType,
} from "./payment-utils";
import { redirect } from "next/navigation";
import { getAbsoluteUrl, isUserAdmin, serverRedirect } from "./utils";
import { getLoggedInUser, getUserLanguage } from "./user-actions";
import { UuidSchema } from "./zod-schemas";
import { getOrganizationSettings } from "./organization-settings-actions";
import z from "zod";
import dayjs from "dayjs";

export const makeSwedbankApiRequest = async (url: string, body?: unknown) => {
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
export const generatePayeeReference = async (orderId: string, prefix: string = "PAY"): Promise<string> => {
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, "");
    const timestamp = Date.now().toString().slice(-10);
    // Add some randomness to prevent collisions in rapid succession
    const random = Math.random().toString(36).substring(2, 5); // 3 chars
    const baseRef = `${prefix}${cleanOrderId.slice(0, 13)}${timestamp}${random}`; // 3+13+10+3=29 chars max
    let payeeRef = baseRef.substring(0, 30); // Ensure max length compliance

    // Check if this payeeRef is already used by another order
    const existingOrder = await prisma.order.findFirst({
        where: {
            payee_ref: payeeRef,
            id: { not: orderId }, // Exclude the current order
        },
    });

    if (existingOrder) {
        // Generate a new one with additional entropy
        const fallbackPayeeRef = `${payeeRef}${Math.random().toString(36).substring(2, 5)}`;
        payeeRef = fallbackPayeeRef.substring(0, 30); // Ensure max length
    }

    return payeeRef
};

interface SwedbankPaymentRequestBody {
    paymentorder: {
        operation: "Purchase";
        currency: "SEK";
        amount: number;
        vatAmount: 0;
        description: string;
        generateUnscheduledToken?: boolean;
        unscheduledToken?: SubscriptionToken;
        userAgent: string;
        language: string;
        urls: {
            hostUrls: string[];
            completeUrl: string;
            cancelUrl: string;
            callbackUrl: string;
            logoUrl: string | undefined;
            termsOfServiceUrl: string;
        };
        payeeInfo: {
            payeeId: string;
            payeeReference: string; // Compliant: alphanumeric, max 30 chars, unique
            payeeName: string;
            orderReference: string; // Internal order reference (can contain hyphens)
        };
        // TODO: Include order items in the payment request for better tracking
    };
}

export const getSwedbankPaymentRequestPurchasePayload = async (
    orderId: string,
    subscribe: boolean = false,
): Promise<SwedbankPaymentRequestBody> => {
    // Validate that the order contains subscribeable products
    // only memberships are subscribeable currently
    if (subscribe) {
        const loggedInUser = await getLoggedInUser();
        const order = await getOrderById(loggedInUser.id, orderId);
        const hasSubscribeableProducts = order.order_items.some((item) => item.product.membership);
        if (!hasSubscribeableProducts) {
            throw new Error("Order does not contain subscribeable products");
        }
    }

    // Create a compliant payeeReference: alphanumeric, max 30 chars, unique per payment attempt
    let payeeRef = await generatePayeeReference(orderId, "PAY");
    const order = await prisma.order.update({
        where: { id: orderId },
        data: { payee_ref: payeeRef },
    });

    const organizationSettings = await getOrganizationSettings();
    const userLanguage = await getUserLanguage();
    return {
        paymentorder: {
            operation: "Purchase",
            currency: "SEK",
            amount: order.total_amount,
            vatAmount: 0,
            description: `Purchase`,
            generateUnscheduledToken: subscribe,
            userAgent: (await headers()).get("user-agent") || "Unknown",
            language: userLanguage === Language.swedish ? "sv-SE" : "en-US",
            urls: {
                hostUrls: [getAbsoluteUrl([GlobalConstants.HOME])],
                completeUrl: getAbsoluteUrl([GlobalConstants.ORDER], {
                    [GlobalConstants.ORDER_ID]: orderId,
                }),
                cancelUrl: getAbsoluteUrl([GlobalConstants.ORDER], {
                    [GlobalConstants.ORDER_ID]: orderId,
                }),
                callbackUrl: getAbsoluteUrl([GlobalConstants.PAYMENT_CALLBACK], {
                    [GlobalConstants.ORDER_ID]: orderId,
                }),
                logoUrl: organizationSettings?.logo_url || undefined,
                termsOfServiceUrl: organizationSettings?.terms_of_purchase_english_url || undefined,
            },
            payeeInfo: {
                payeeId: process.env.SWEDBANK_PAY_PAYEE_ID,
                payeeReference: payeeRef, // Compliant: alphanumeric, max 30 chars, unique
                payeeName: process.env.NEXT_PUBLIC_ORG_NAME,
                orderReference: orderId, // Your internal order reference (can contain hyphens)
            },
            // TODO: Include order items in the payment request for better tracking
        },
    };
};

export const createSwedbankPaymentRequest = async (requestBody: SwedbankPaymentRequestBody) => {
    const response = await makeSwedbankApiRequest(
        `${process.env.SWEDBANK_BASE_URL}/psp/paymentorders`,
        requestBody,
    );
    if (!response.ok) throw new Error(`Swedbank Pay request failed: ${await response.text()}`);

    const responseData: PaymentOrderResponse = await response.json();
    const redirectOperation = responseData.operations.find((op) => op.rel === "redirect-checkout");

    if (!redirectOperation || !redirectOperation.href) {
        throw new Error("Redirect URL not found in payment response");
    }

    return { redirectUrl: redirectOperation.href, paymentOrderId: responseData.paymentOrder.id };
};

export const redirectToSwedbankPayment = async (
    orderId: string,
    subscribeToMembership: boolean,
): Promise<void> => {
    const validatedOrderId = UuidSchema.parse(orderId);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: validatedOrderId } });
    if (order?.status !== OrderStatus.pending) {
        throw new Error("Order is not in a pending state");
    }

    const validatedSubscribeToMembership = z.boolean().parse(subscribeToMembership);
    // TODO: Separate payments of subscriptions so they're not tied to each other.
    // Only necessary if we implement a cart with multiple memberships
    if (validatedSubscribeToMembership) {
        const subscribeableOrderItems = await prisma.orderItem.findMany({
            where: {
                order_id: validatedOrderId,
                product: {
                    membership: { isNot: null },
                },
            },
        });
        if (subscribeableOrderItems.length === 0) {
            throw new Error("No valid membership products found for subscription");
        }
    }
    if (order.total_amount < 1) {
        // Free order - no payment needed
        // Directly progress to completed
        const subscriptionToken = validatedSubscribeToMembership
            ? {
                type: "unscheduled" as const,
                token: "free-subscription-" + order.id,
                name: "Free subscription",
                expiryDate: dayjs().add(10, "year").format("MM/YYYY"),
            }
            : undefined;

        await progressOrder(order.id, OrderStatus.paid, false, subscriptionToken);
        return;
    }
    const requestBody = await getSwedbankPaymentRequestPurchasePayload(
        validatedOrderId,
        validatedSubscribeToMembership,
    );
    if (!requestBody) throw new Error("Failed to create payment request");

    const { paymentOrderId, redirectUrl } = await createSwedbankPaymentRequest(requestBody);

    // Save payment order ID to the order to check status later
    await prisma.order.update({
        where: { id: validatedOrderId },
        data: {
            payment_request_id: paymentOrderId,
        },
    });
    redirect(redirectUrl);
};

export const capturePaymentFunds = async (orderId: string) => {
    const validatedOrderId = UuidSchema.parse(orderId);

    const order = await prisma.order.findUniqueOrThrow({
        where: { id: validatedOrderId },
    });
    // Use the same payeeReference that was used for the original authorization
    // This maintains the connection between authorization and capture operations

    if (!order.payee_ref) {
        throw new Error(`Order ${order.id} is missing payeeRef - cannot capture payment safely`);
    }

    // Create a unique capture reference by appending "CAPTURE" to the original payeeRef
    // This ensures each capture attempt has a unique reference while maintaining traceability
    const capturePayeeRef = `${order.payee_ref}CAP`.substring(0, 30);

    const capturePaymentResponse = await makeSwedbankApiRequest(
        `https://api.externalintegration.payex.com${order.payment_request_id}/captures`,
        {
            transaction: {
                description: "Capturing authorized payment",
                amount: order.total_amount, // Convert to smallest currency unit
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
    userId: string,
    orderId: string,
    paymentRequestId: string = undefined,
): Promise<void> => {
    const validatedUserId = UuidSchema.parse(userId);
    const validatedOrderId = UuidSchema.parse(orderId);

    const order = await getOrderById(validatedUserId, validatedOrderId);

    // Only allow admins to check other users' orders
    const loggedInUser = await getLoggedInUser();
    if (!isUserAdmin(loggedInUser) && order.user_id !== validatedUserId) {
        serverRedirect([GlobalConstants.HOME]);
    }

    if (order.status === OrderStatus.completed) {
        return;
    }

    // If the order is free, complete it immediately.
    if (order.total_amount === 0) {
        await progressOrder(orderId, OrderStatus.completed);
        return;
    }

    if (paymentRequestId || order.payment_request_id) {
        const paymentStatusResponse = await makeSwedbankApiRequest(
            `https://api.externalintegration.payex.com${paymentRequestId || order.payment_request_id}?$expand=paid`,
        );
        if (!paymentStatusResponse.ok) {
            progressOrder(orderId, OrderStatus.error);
            throw new Error("Failed to check payment status");
        }
        const paymentStatusData: PaymentOrderResponse = await paymentStatusResponse.json();
        const paymentStatus = paymentStatusData.paymentOrder.status;
        const newOrderStatus = getNewOrderStatus(paymentStatus);
        const subscriptionToken: SubscriptionToken | undefined =
            paymentStatusData.paymentOrder.paid.tokens?.[0];
        const needsCapture =
            paymentStatusData.paymentOrder.paid.transactionType === TransactionType.Authorization;
        await progressOrder(orderId, newOrderStatus, needsCapture, subscriptionToken);
    }
};
