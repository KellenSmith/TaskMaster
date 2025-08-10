"use client";

import React, { useEffect, useActionState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Container, Typography, Stack, CircularProgress, useTheme } from "@mui/material";
import { checkPaymentStatus } from "../../../lib/payment-actions";
import { getOrderById } from "../../../lib/order-actions";
import OrderSummary from "../OrderSummary";
import GlobalConstants from "../../../GlobalConstants";
import { OrderStatus } from "@prisma/client";
import {
    DatagridActionState,
    defaultDatagridActionState,
    defaultFormActionState,
    FormActionState,
} from "../../../lib/definitions";

const OrderCompletePage = () => {
    const theme = useTheme();
    const searchParams = useSearchParams();
    const orderId = searchParams.get("orderId");
    const [isPending, startTransition] = useTransition();

    const [paymentState, checkPaymentAction, paymentPending] = useActionState(
        async (currentActionState: FormActionState) => {
            return await checkPaymentStatus(orderId, currentActionState);
        },
        defaultFormActionState,
    );

    const [orderState, getOrderAction, orderPending] = useActionState(
        async (currentActionState: DatagridActionState) => {
            return await getOrderById(currentActionState, orderId);
        },
        defaultDatagridActionState,
    );

    useEffect(() => {
        if (!orderId) return;

        // First check payment status wrapped in startTransition
        startTransition(() => {
            checkPaymentAction();
        });
    }, [orderId, checkPaymentAction]);

    useEffect(() => {
        // Once payment status is successfully checked, fetch order details
        if (paymentState.status === 200 && !paymentPending && orderId) {
            startTransition(() => {
                getOrderAction();
            });
        }
    }, [paymentState.status, paymentPending, orderId, getOrderAction]); // Handle loading and error states
    const isLoading = paymentPending || orderPending || isPending;
    const hasPaymentError = paymentState.status !== 200 && paymentState.errorMsg;
    const hasOrderError = orderState.status !== 200 && orderState.errorMsg;
    const hasError = !orderId || hasPaymentError || hasOrderError;

    const order = orderState.result && orderState.result.length > 0 ? orderState.result[0] : null;

    if (!orderId) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography color="error">Order ID is required</Typography>
            </Container>
        );
    }

    if (isLoading) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Stack spacing={3} alignItems="center">
                    <CircularProgress />
                    <Typography color={theme.palette.text.secondary}>
                        {paymentPending ? "Checking payment status..." : "Loading order details..."}
                    </Typography>
                </Stack>
            </Container>
        );
    }

    if (hasError) {
        const errorMessage = hasPaymentError
            ? paymentState.errorMsg
            : hasOrderError
              ? orderState.errorMsg
              : "An unexpected error occurred";

        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography color="error">{errorMessage}</Typography>
            </Container>
        );
    }

    const getStatusMessage = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.completed:
                return "Thank you for your order! Your payment has been processed and your order is complete.";
            case OrderStatus.paid:
                return "Thank you for your order! Your payment has been processed and is being fulfilled.";
            case OrderStatus.pending:
                return "Your order is currently pending payment. Please complete the payment process.";
            case OrderStatus.cancelled:
                return "This order has been cancelled. If you have any questions, please contact support.";
            default:
                return `Your order status is ${status}.`;
        }
    };

    const statusInfo = order ? getStatusMessage(order[GlobalConstants.STATUS]) : null;

    return (
        order && (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Stack spacing={3}>
                    {<OrderSummary order={order} />}

                    {statusInfo && (
                        <Typography color={theme.palette.text.secondary}>
                            {getStatusMessage(order.status)}
                        </Typography>
                    )}
                </Stack>
            </Container>
        )
    );
};

export default OrderCompletePage;
