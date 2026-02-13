import { Prisma } from "../../prisma/generated/client";
import { makeSwedbankApiRequest } from "./payment-actions";

export const capturePaymentFunds = async (order: Prisma.OrderGetPayload<true>) => {
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

    const responseText = await capturePaymentResponse.text();
    return responseText;
};
