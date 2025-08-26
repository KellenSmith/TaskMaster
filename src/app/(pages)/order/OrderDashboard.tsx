"use client";
import { Prisma } from "@prisma/client";
import PaymentHandler from "../../ui/payment/PaymentHandler";
import OrderSummary from "./OrderSummary";
import { use, useEffect, useTransition } from "react";
import { LoadingFallback } from "../../ui/ErrorBoundarySuspense";
import { useUserContext } from "../../context/UserContext";
import { useNotificationContext } from "../../context/NotificationContext";
import { useRouter } from "next/navigation";
import GlobalConstants from "../../GlobalConstants";
import { checkPaymentStatus } from "../../lib/payment-actions";
import { clientRedirect } from "../../lib/definitions";

interface OrderDashboardProps {
    orderPromise: Promise<
        Prisma.OrderGetPayload<{
            include: { orderItems: { include: { product: { include: { membership: true } } } } };
        }>
    >;
}

const OrderDashboard = ({ orderPromise }: OrderDashboardProps) => {
    const { user, refreshSession } = useUserContext();
    const order = use(orderPromise);
    const router = useRouter();

    // Only allow showing the user's own orders
    if (user?.id !== order.userId) clientRedirect(router, [GlobalConstants.HOME]);

    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();

    // Check payment status immediately
    useEffect(() => {
        startTransition(async () => {
            try {
                await checkPaymentStatus(user.id, order.id);
                await refreshSession();
            } catch {
                addNotification(
                    "Failed to check order status. What you see might not be up to date.",
                    "error",
                );
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
