"use server";
import GlobalConstants from "../GlobalConstants";
import { headers } from "next/headers";
import { getOrderById, updateOrderStatus } from "./order-actions";
import { Order, OrderStatus } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { getNewOrderStatus, PaymentOrderResponse } from "./payment-utils";
import { defaultDatagridActionState, defaultFormActionState, FormActionState } from "./definitions";

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
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9]/g, ""); // Remove hyphens and non-alphanumeric
    const timestamp = Date.now().toString().slice(-10); // Last 10 digits for good precision
    const payeeRef = `PAY${cleanOrderId.slice(0, 16)}${timestamp}`; // 3+16+10=29 chars

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

        const response = await fetch(
            `https://api.externalintegration.payex.com/psp/paymentorders`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json;version=3.1",
                    Authorization: `Bearer ${process.env.SWEDBANK_PAY_ACCESS_TOKEN}`,
                },
                body: JSON.stringify(requestBody),
            },
        );

        if (!response.ok) {
            throw new Error("Failed to create payment request");
        }

        const responseData: PaymentOrderResponse = await response.json();
        console.log(responseData);
        const redirectOperation = responseData.operations.find(
            (op) => op.rel === "redirect-checkout",
        );

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
    const paymentStatusResponse = await fetch(
        `https://api.externalintegration.payex.com${paymentRequestId}?$expand=paid`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json;version=3.1",
                Authorization: `Bearer ${process.env.SWEDBANK_PAY_ACCESS_TOKEN}`,
            },
        },
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
    if (order.status !== OrderStatus.completed && order.status !== newOrderStatus)
        return await updateOrderStatus(orderId, defaultFormActionState, newOrderStatus);

    return defaultFormActionState;
};
