"use client";
import { Prisma } from "@prisma/client";
import PaymentHandler from "./PaymentHandler";
import OrderSummary from "./OrderSummary";
import { use, useEffect, useTransition } from "react";
import { LoadingFallback } from "../../ui/ErrorBoundarySuspense";
import { useUserContext } from "../../context/UserContext";
import { NotificationSeverity, useNotificationContext } from "../../context/NotificationContext";
import { checkPaymentStatus } from "../../lib/payment-actions";
import LanguageTranslations from "./LanguageTranslations";

interface OrderDashboardProps {
    orderPromise: Promise<
        Prisma.OrderGetPayload<{
            include: { order_items: { include: { product: { include: { membership: true } } } } };
        }>
    >;
}

const OrderDashboard = ({ orderPromise }: OrderDashboardProps) => {
    const { user, language } = useUserContext();
    const order = use(orderPromise);

    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();

    // Check payment status immediately
    useEffect(() => {
        startTransition(async () => {
            try {
                if (!user) throw new Error("User not logged in");
                await checkPaymentStatus(user.id, order.id);
            } catch {
                addNotification(LanguageTranslations.failedCheckOrderStatus[language], NotificationSeverity.error);
            }
        });
        // Check payment status once upon render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Don't show order until payment status is checked
    if (isPending) return <LoadingFallback />;

    return (
        <>
            <OrderSummary order={order} />
            <PaymentHandler orderPromise={orderPromise} />
        </>
    );
};

export default OrderDashboard;
