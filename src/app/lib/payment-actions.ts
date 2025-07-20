"use server";
import { FormActionState } from "../ui/form/Form";
import GlobalConstants from "../GlobalConstants";
import { headers } from "next/headers";
import { getOrderById } from "./order-actions";
import { defaultActionState } from "../ui/Datagrid";
import { Order } from "@prisma/client";

type PaymentOperation = {
    method: string;
    href: string;
    rel: string;
    contentType: string;
};

type PaymentOrderResponse = {
    paymentorder: {
        id: string;
        created: string;
        updated: string;
        operation: string;
        status: string;
        currency: string;
        vatAmount: number;
        amount: number;
        description: string;
        initiatingSystemUserAgent: string;
        language: string;
        availableInstruments: string[];
        implementation: string;
        instrumentMode: boolean;
        guestMode: boolean;
        orderItems: { id: string };
        urls: { id: string };
        payeeInfo: { id: string };
        payer: { id: string };
        history: { id: string };
        failed: { id: string };
        aborted: { id: string };
        paid: { id: string };
        cancelled: { id: string };
        reversed: { id: string };
        financialTransactions: { id: string };
        failedAttempts: { id: string };
        postPurchaseFailedAttempts: { id: string };
        metadata: { id: string };
    };
    operations: PaymentOperation[];
};

const getSwedbankPaymentRequestPayload = async (orderId: string) => {
    // Find order by ID
    const orderResult = await getOrderById(defaultActionState, orderId);
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
            `https://api.externalintegration.payex.com/psp/paymentorders`, // /api/payments/create?orderId=${orderId}
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
        const redirectOperation = responseData.operations.find(
            (op) => op.rel === "redirect-checkout",
        );

        newActionState.status = 200;
        newActionState.result = redirectOperation.href;
        newActionState.errorMsg = "";
    } catch (error) {
        console.log(error);
        newActionState.status = 500;
        newActionState.errorMsg =
            error instanceof Error ? error.message : "An unexpected error occurred";
        newActionState.result = "";
    }
    return newActionState;
};
