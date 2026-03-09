import { headers } from "next/headers";
import { Language, Prisma } from "../../prisma/generated/client";
import { prisma } from "../../prisma/prisma-client";
import {
    PaymentOrderResponse,
    PaymentState,
    SwedbankPaymentRequestBody,
    TransactionType,
} from "./payment-types";
import { getAbsoluteUrl } from "./utils";
import GlobalConstants from "../GlobalConstants";
import { getOrganizationSettings } from "./organization-settings-helpers";
import { getUserLanguage } from "./user-helpers";
import { redirect } from "next/navigation";

export const isSwedbankPayConfigured = (): boolean => {
    return (
        !!process.env.SWEDBANK_PAY_ACCESS_TOKEN &&
        !!process.env.SWEDBANK_PAY_PAYEE_ID &&
        !!process.env.SWEDBANK_BASE_URL
    );
};

const makeSwedbankApiRequest = async (url: string, body?: unknown) => {
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
const generatePayeeReference = async (
    order: Prisma.OrderGetPayload<{}>,
    prefix: string = "PAY",
): Promise<string> => {
    const cleanOrderId = order.id.replace(/[^a-zA-Z0-9]/g, "");
    const timestamp = Date.now().toString().slice(-10);
    // Add some randomness to prevent collisions in rapid succession
    const random = Math.random().toString(36).substring(2, 5); // 3 chars
    const baseRef = `${prefix}${cleanOrderId.slice(0, 13)}${timestamp}${random}`; // 3+13+10+3=29 chars max
    let payeeRef = baseRef.substring(0, 30); // Ensure max length compliance

    return payeeRef;
};

const getCreateSwedbankPaymentRequestPayload = async (
    order: Prisma.OrderGetPayload<{
        include: {
            order_items: { include: { product: { include: { membership: true; ticket: true } } } };
        };
    }>,
): Promise<SwedbankPaymentRequestBody> => {
    // Create a compliant payeeReference: alphanumeric, max 30 chars, unique per payment attempt
    const payeeRef = await generatePayeeReference(order, "PAY");
    const organizationSettings = await getOrganizationSettings();
    const userLanguage = await getUserLanguage();

    return {
        paymentorder: {
            operation: "Purchase",
            currency: "SEK",
            // TODO: Add age restriction
            amount: order.total_amount,
            vatAmount: order.total_vat_amount,
            description: `Purchase`,
            userAgent: (await headers()).get("user-agent") || "Unknown",
            language: userLanguage === Language.swedish ? "sv-SE" : "en-US",
            urls: {
                hostUrls: [getAbsoluteUrl([GlobalConstants.HOME])],
                completeUrl: getAbsoluteUrl([GlobalConstants.ORDER], {
                    [GlobalConstants.ORDER_ID]: order.id,
                }),
                cancelUrl: getAbsoluteUrl([GlobalConstants.ORDER], {
                    [GlobalConstants.ORDER_ID]: order.id,
                }),
                callbackUrl: getAbsoluteUrl([GlobalConstants.PAYMENT_CALLBACK], {
                    [GlobalConstants.ORDER_ID]: order.id,
                }),
                logoUrl: organizationSettings?.logo_url || undefined,
                termsOfServiceUrl:
                    userLanguage === Language.swedish
                        ? organizationSettings?.terms_of_purchase_swedish_url ||
                          organizationSettings?.terms_of_purchase_english_url ||
                          undefined
                        : organizationSettings?.terms_of_purchase_english_url ||
                          organizationSettings?.terms_of_purchase_swedish_url ||
                          undefined,
            },
            payeeInfo: {
                payeeId: process.env.SWEDBANK_PAY_PAYEE_ID as string,
                payeeReference: payeeRef, // Compliant: alphanumeric, max 30 chars, unique
                payeeName: process.env.NEXT_PUBLIC_ORG_NAME as string,
                orderReference: order.id, // Your internal order reference (can contain hyphens)
            },
            orderItems: order.order_items.map(
                (
                    orderItem: Prisma.OrderItemGetPayload<{
                        include: { product: { include: { membership: true; ticket: true } } };
                    }>,
                ) => ({
                    reference: orderItem.product.id,
                    name: orderItem.product.name,
                    type: "PRODUCT",
                    class: orderItem.product.membership
                        ? "Membership"
                        : orderItem.product.ticket
                          ? "Ticket"
                          : "Product",
                    description:
                        orderItem.product.description ||
                        (orderItem.product.membership
                            ? "Membership"
                            : orderItem.product.ticket
                              ? "Ticket"
                              : "Product"),
                    quantity: orderItem.quantity,
                    quantityUnit: "pcs",
                    unitPrice: orderItem.product.price,
                    discountPrice: 0,
                    vatPercent: orderItem.product.vat_percentage,
                    amount: orderItem.price,
                    vatAmount: orderItem.vat_amount,
                }),
            ),
        },
    };
};

const createSwedbankPaymentRequest = async (
    order: Prisma.OrderGetPayload<{
        include: {
            order_items: { include: { product: { include: { membership: true; ticket: true } } } };
        };
    }>,
) => {
    const requestBody = await getCreateSwedbankPaymentRequestPayload(order);

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
    order: Prisma.OrderGetPayload<{
        include: {
            order_items: { include: { product: { include: { membership: true; ticket: true } } } };
        };
    }>,
) => {
    const { paymentOrderId, redirectUrl } = await createSwedbankPaymentRequest(order);

    // Save payment order ID to the order to check status later
    await prisma.order.update({
        where: { id: order.id },
        data: {
            payment_request_id: paymentOrderId,
        },
    });

    redirect(redirectUrl);
};

export const isOrderpaid = async (
    order: Prisma.OrderGetPayload<{ select: { id: true; payment_request_id: true } }>,
): Promise<{ isPaid: boolean; needsCapture: boolean }> => {
    const paymentStatusResponse = await makeSwedbankApiRequest(
        `${process.env.SWEDBANK_BASE_URL}${order.payment_request_id}?$expand=paid`,
    );
    if (!paymentStatusResponse.ok) {
        console.error(
            `Failed to check payment status for order ${order.id}:`,
            paymentStatusResponse.status,
            paymentStatusResponse.statusText,
            await paymentStatusResponse.text(),
        );
        throw new Error("Failed to check payment status");
    }
    const paymentStatusData: PaymentOrderResponse = await paymentStatusResponse.json();
    const paymentStatus = paymentStatusData.paymentOrder.status;
    let needsCapture = false;
    if (paymentStatus === PaymentState.Paid)
        needsCapture =
            paymentStatusData.paymentOrder.paid.transactionType === TransactionType.Authorization;

    return { isPaid: paymentStatus === PaymentState.Paid, needsCapture };
};

export const capturePaymentFunds = async (
    order: Prisma.OrderGetPayload<{
        select: { payee_ref: true; id: true; payment_request_id: true; total_amount: true };
    }>,
) => {
    // Use the same payeeReference that was used for the original authorization
    // This maintains the connection between authorization and capture operations

    if (!order.payee_ref) {
        throw new Error(`Order ${order.id} is missing payeeRef - cannot capture payment safely`);
    }

    // Create a unique capture reference by appending "CAPTURE" to the original payeeRef
    // This ensures each capture attempt has a unique reference while maintaining traceability
    const capturePayeeRef = `${order.payee_ref}CAP`.substring(0, 30);

    const capturePaymentResponse = await makeSwedbankApiRequest(
        `${process.env.SWEDBANK_BASE_URL}${order.payment_request_id}/captures`,
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
};
