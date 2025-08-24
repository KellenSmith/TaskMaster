"use client";
import { Button, Stack } from "@mui/material";
import React from "react";
import { redirectToSwedbankPayment } from "../../lib/payment-actions";
import { OrderStatus, Prisma } from "@prisma/client";
import { useNotificationContext } from "../../context/NotificationContext";
import { allowRedirectException } from "../utils";
import ConfirmButton from "../ConfirmButton";
import { progressOrder } from "../../lib/order-actions";

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

    const cancelOrder = async () => {
        try {
            await progressOrder(order.id, OrderStatus.cancelled);
            addNotification("Cancelled order", "success");
        } catch {
            addNotification("Failed to cancel order", "error");
        }
    };

    return (
        order.status === OrderStatus.pending && (
            <Stack alignItems="center">
                <Button color="success" fullWidth onClick={redirectToPayment}>
                    {order.totalAmount === 0 ? "confirm" : "pay"}
                </Button>
                <ConfirmButton fullWidth color="error" onClick={cancelOrder}>
                    cancel
                </ConfirmButton>
            </Stack>
        )
    );
};

export default PaymentHandler;
