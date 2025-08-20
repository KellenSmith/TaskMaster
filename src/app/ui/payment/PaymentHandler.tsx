"use client";
import { Button, Stack } from "@mui/material";
import React from "react";
import { redirectToSwedbankPayment } from "../../lib/payment-actions";
import { OrderStatus, Prisma } from "@prisma/client";
import { useNotificationContext } from "../../context/NotificationContext";
import { allowRedirectException } from "../utils";

interface PaymentHandlerProps {
    order: Prisma.OrderGetPayload<{ include: { orderItems: { include: { product: true } } } }>;
}

const PaymentHandler = ({ order }: PaymentHandlerProps) => {
    const { addNotification } = useNotificationContext();

    const redirectToPayment = async () => {
        try {
            await redirectToSwedbankPayment(order.id);
        } catch (error) {
            allowRedirectException(error);
            // Show notification for all other errors
            addNotification("Failed to redirect to payment", "error");
        }
    };

    return (
        order.status === OrderStatus.pending && (
            <Stack spacing={2} alignItems="center">
                <Button fullWidth onClick={redirectToPayment}>
                    {order.totalAmount === 0 ? "confirm" : "pay"}
                </Button>
            </Stack>
        )
    );
};

export default PaymentHandler;
