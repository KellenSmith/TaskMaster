"use client";
import { Button, Stack } from "@mui/material";
import React, { use } from "react";
import { redirectToSwedbankPayment } from "../../lib/payment-actions";
import { OrderStatus, Prisma } from "@prisma/client";
import { useNotificationContext } from "../../context/NotificationContext";

interface PaymentHandlerProps {
    orderPromise: Promise<
        Prisma.OrderGetPayload<{ include: { orderItems: { include: { product: true } } } }>
    >;
}

const PaymentHandler = ({ orderPromise }: PaymentHandlerProps) => {
    const order = use(orderPromise);
    const { addNotification } = useNotificationContext();

    const redirectToPayment = async () => {
        try {
            await redirectToSwedbankPayment(order.id);
        } catch (error) {
            // Re-throw Next.js redirect errors to allow the redirect to work
            if (error.digest?.startsWith("NEXT_REDIRECT")) {
                throw error;
            }
            // Show notification for all other errors
            addNotification("Failed to redirect to payment", "error");
        }
    };

    return (
        order.status === OrderStatus.pending && (
            <Stack spacing={2} alignItems="center">
                <Button fullWidth onClick={redirectToPayment}>
                    {order.totalAmount === 0 ? "pay" : "confirm"}
                </Button>
            </Stack>
        )
    );
};

export default PaymentHandler;
