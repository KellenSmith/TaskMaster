"use server";
// ...existing code...
import GlobalConstants from "../../GlobalConstants";
import OrderDashboard from "./OrderDashboard";
import { getLoggedInUser } from "../../lib/user-helpers";
import { prisma } from "../../../prisma/prisma-client";
import { isUserAdmin } from "../../lib/utils";
import { cacheTag } from "next/cache";
import { getOrderCacheTag } from "../../lib/order-actions";

interface OrderPageProps {
    searchParams: Promise<{ [orderId: string]: string }>;
}

const getCachedOrderById = async (
    loggedInUserId: string,
    loggedInUserIsAdmin: boolean,
    orderId: string,
) => {
    "use cache";
    cacheTag(await getOrderCacheTag(orderId));

    const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
            order_items: {
                include: {
                    product: { include: { membership: true } },
                },
            },
        },
    });

    if (loggedInUserId !== order.user_id && !loggedInUserIsAdmin)
        throw new Error("Not authorized to view this order");

    return order;
};

const OrderPage = async ({ searchParams }: OrderPageProps) => {
    const orderId = (await searchParams)[GlobalConstants.ORDER_ID] as string;
    const loggedInUser = await getLoggedInUser();
    const orderPromise = loggedInUser
        ? getCachedOrderById(loggedInUser.id, isUserAdmin(loggedInUser), orderId)
        : Promise.reject(new Error("Not authorized to view this order"));

    return <OrderDashboard orderPromise={orderPromise} />;
};

export default OrderPage;
