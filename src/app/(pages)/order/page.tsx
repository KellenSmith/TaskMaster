"use server";
// ...existing code...
import GlobalConstants from "../../GlobalConstants";
import OrderDashboard from "./OrderDashboard";
import { getLoggedInUser } from "../../lib/user-helpers";
import { prisma } from "../../../prisma/prisma-client";
import { isUserAdmin } from "../../lib/utils";

interface OrderPageProps {
    searchParams: Promise<{ [orderId: string]: string }>;
}

const OrderPage = async ({ searchParams }: OrderPageProps) => {
    const orderId = (await searchParams)[GlobalConstants.ORDER_ID] as string;
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error("Not authorized to view this order");

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

    if (loggedInUser.id !== order.user_id && !isUserAdmin(loggedInUser))
        throw new Error("Not authorized to view this order");

    return <OrderDashboard orderPromise={new Promise((resolve) => resolve(order))} />;
};

export default OrderPage;
