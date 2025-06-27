"use server";
import { FormActionState } from "../ui/form/Form";
import GlobalConstants from "../GlobalConstants";
import { headers } from "next/headers";
import { getOrderById } from "./order-actions";
import { defaultActionState } from "../ui/Datagrid";

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
    const order = orderResult.result[0];
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown";

    return {
        paymentorder: {
            operation: "Purchase",
            currency: "SEK",
            amount: order.totalPrice,
            vatAmount: 0,
            description: `Purchase of ${process.env.NEXT_PUBLIC_ORG_NAME} order #${orderId}`,
            userAgent: userAgent,
            language: "en-US",
            // TODO: Configure host urls
            urls: {
                hostUrls: ["https://example.com/"],
                cancelUrl: `${process.env.VERCEL_URL}/${GlobalConstants.ORDER}/${orderId}/cancel`,
                callbackUrl: `${process.env.VERCEL_URL}/api/payment-callback?orderId=${orderId}`,
                // logoUrl: "https://example.com/logo.png",
                // termsOfServiceUrl: "https://example.com/termsandconditions.pdf",
            },
            // TODO: Configure payee info
            payeeInfo: {
                payeeId: process.env.SWEDBANK_PAY_PAYEE_ID,
                payeeReference: "AB832",
                payeeName: "Kulturföreningen Wish",
                orderReference: orderId,
            },
        },
    };
};

// const mockedPaymentRequestResponse = (orderId: string) => ({
//     paymentorder: {
//         id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce",
//         created: "2020-06-22T10:56:56.2927632Z",
//         updated: "2020-06-22T10:56:56.4035291Z",
//         operation: "Purchase",
//         status: "Initialized",
//         currency: "SEK",
//         vatAmount: 375,
//         amount: 1500,
//         description: "Test Purchase",
//         initiatingSystemUserAgent: "swedbankpay-sdk-dotnet/3.0.1",
//         language: "sv-SE",
//         availableInstruments: [
//             "CreditCard",
//             "Invoice-PayExFinancingSe",
//             "Invoice-PayMonthlyInvoiceSe",
//             "Swish",
//             "CreditAccount",
//             "Trustly",
//         ],
//         implementation: "PaymentsOnly",
//         instrumentMode: false,
//         guestMode: false,
//         orderItems: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/orderitems",
//         },
//         urls: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/urls",
//         },
//         payeeInfo: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/payeeinfo",
//         },
//         payer: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/payers",
//         },
//         history: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/history",
//         },
//         failed: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/failed",
//         },
//         aborted: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/aborted",
//         },
//         paid: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/paid",
//         },
//         cancelled: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/cancelled",
//         },
//         reversed: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/reversed",
//         },
//         financialTransactions: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/financialtransactions",
//         },
//         failedAttempts: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/failedattempts",
//         },
//         postPurchaseFailedAttempts: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/failedattempts",
//         },
//         metadata: {
//             id: "/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce/metadata",
//         },
//     },
//     operations: [
//         {
//             method: "GET",
//             href: `${process.env.VERCEL_URL}/${GlobalConstants.ORDER}/dev-pay?orderId=${orderId}`,
//             rel: "redirect-checkout",
//             contentType: "text/html",
//         },
//         {
//             method: "GET",
//             href: "https://ecom.externalintegration.payex.com/payment/core/js/px.payment.client.js?token=5a17c24e-d459-4567-bbad-aa0f17a76119&culture=nb-NO&_tc_tid=30f2168171e142d38bcd4af2c3721959",
//             rel: "view-checkout",
//             contentType: "application/javascript",
//         },
//         {
//             href: "https://api.payex.com/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce",
//             rel: "update-order",
//             method: "PATCH",
//             contentType: "application/json",
//         },
//         {
//             href: "https://api.payex.com/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce",
//             rel: "abort",
//             method: "PATCH",
//             contentType: "application/json",
//         },
//         {
//             href: "https://api.payex.com/psp/paymentorders/09ccd29a-7c4f-4752-9396-12100cbfecce",
//             rel: "abort-paymentattempt",
//             method: "PATCH",
//             contentType: "application/json",
//         },
//     ],
// });

export const getPaymentRedirectUrl = async (
    currentActionState: FormActionState,
    orderId: string,
): Promise<FormActionState> => {
    const newActionState: FormActionState = { ...currentActionState };
    try {
        const requestBody = await getSwedbankPaymentRequestPayload(orderId);
        if (!requestBody) throw new Error("Failed to create payment request");
        const response = await fetch(
            `http://api.externalintegration.payex.com/psp/paymentorders`, // /api/payments/create?orderId=${orderId}
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
