"use server";
import OrdersDashboard from "./OrdersDashboard";
import { prisma } from "../../../prisma/prisma-client";
import ProtectedPage from "../../ProtectedPage";
import GlobalConstants from "../../GlobalConstants";

const getCachedOrders = async () => {
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
    return (
        <ProtectedPage name={GlobalConstants.ORDERS}>
            <OrdersDashboard ordersPromise={ordersPromise} />
        </ProtectedPage>
    );
};

export default OrdersPage;
