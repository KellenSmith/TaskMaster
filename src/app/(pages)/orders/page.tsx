"use server";
import OrdersDashboard from "./OrdersDashboard";
import { prisma } from "../../../prisma/prisma-client";
import { cacheTag } from "next/cache";
import GlobalConstants from "../../GlobalConstants";

const getCachedOrders = async () => {
    "use cache";
    cacheTag(GlobalConstants.ORDER);

    return await prisma.order.findMany({
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
};

const OrdersPage = async () => {
    const ordersPromise = getCachedOrders();
    return <OrdersDashboard ordersPromise={ordersPromise} />;
};

export default OrdersPage;
