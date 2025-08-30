"use client";
import { Button, Stack } from "@mui/material";
import React, { use } from "react";
import { redirectToSwedbankPayment } from "../../lib/payment-actions";
import { OrderStatus, Prisma } from "@prisma/client";
import { useNotificationContext } from "../../context/NotificationContext";
import { allowRedirectException } from "../../ui/utils";
import ConfirmButton from "../../ui/ConfirmButton";
import { progressOrder } from "../../lib/order-actions";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";

interface PaymentHandlerProps {
    orderPromise: Promise<
        Prisma.OrderGetPayload<{ include: { order_items: { include: { product: true } } } }>
    >;
}

const PaymentHandler = ({ orderPromise }: PaymentHandlerProps) => {
    const { language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const order = use(orderPromise);

    const redirectToPayment = async () => {
        try {
            await redirectToSwedbankPayment(order.id);
        } catch (error) {
            allowRedirectException(error);
            // Show notification for all other errors
            addNotification(LanguageTranslations.failedPaymentRedirect[language], "error");
        }
    };

    const cancelOrder = async () => {
        try {
            await progressOrder(order.id, OrderStatus.cancelled);
            addNotification(LanguageTranslations.cancelledOrder[language], "success");
        } catch {
            addNotification(LanguageTranslations.cancelledOrder[language], "error");
        }
    };

    return (
        order.status === OrderStatus.pending && (
            <Stack alignItems="center">
                <Button color="success" fullWidth onClick={redirectToPayment}>
                    {LanguageTranslations.pay[language](order.total_amount)}
                </Button>
                <ConfirmButton fullWidth color="error" onClick={cancelOrder}>
                    {GlobalLanguageTranslations.cancel[language]}
                </ConfirmButton>
            </Stack>
        )
    );
};

export default PaymentHandler;
