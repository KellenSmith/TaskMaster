"use server";
import OrdersDashboard from "./OrdersDashboard";
// ...existing code...
import { prisma } from "../../../prisma/prisma-client";

const OrdersPage = async () => {
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
    return <OrdersDashboard ordersPromise={ordersPromise} />;
};

export default OrdersPage;
