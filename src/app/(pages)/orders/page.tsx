"use server";
import OrdersDashboard from "./OrdersDashboard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { prisma } from "../../../prisma/prisma-client";

const OrdersPage = () => {
    const ordersPromise = prisma.order.findMany({
        include: {
            user: {
                select: {
                    nickname: true,
                },
            },
            order_items: {
                include: {
                    product: true,
                },
            },
        },
    });
    return (
        <ErrorBoundarySuspense>
            <OrdersDashboard ordersPromise={ordersPromise} />
        </ErrorBoundarySuspense>
    );
};

export default OrdersPage;
