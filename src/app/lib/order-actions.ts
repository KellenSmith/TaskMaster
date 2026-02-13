"use server";

import { OrderStatus, Prisma, UserRole } from "@/prisma/generated/client";
import { prisma } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import { serverRedirect } from "./utils";
import { UuidSchema } from "./zod-schemas";
import { getLoggedInUser } from "./user-actions";
import { validateAndBuildOrderItems } from "./order-item-helpers";

export const createAndRedirectToOrder = async (
    orderItems: Prisma.OrderItemCreateManyOrderInput[],
): Promise<void> => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error("User must be logged in to create an order");

    const createdOrder = await prisma.$transaction(async (tx) => {
        // Create the order with items in a transaction to ensure data consistency
        // and proper stock validation

        const validOrderItems = await validateAndBuildOrderItems(tx, orderItems);

        // OrderItem price, vat and quantity have been validated at this point
        const order = await tx.order.create({
            data: {
                total_amount: validOrderItems.reduce(
                    (acc, item) => (item.price as number) * (item.quantity as number) + acc,
                    0,
                ),
                total_vat_amount: validOrderItems.reduce(
                    (acc, item) => (item.vat_amount as number) * (item.quantity as number) + acc,
                    0,
                ),
                user: {
                    connect: {
                        id: loggedInUser.id,
                    },
                },
                order_items: {
                    createMany: {
                        data: validOrderItems,
                    },
                },
            },
            select: {
                id: true,
            },
        });
        return order;
    });

    serverRedirect([GlobalConstants.ORDER], { [GlobalConstants.ORDER_ID]: createdOrder.id });
};

export const cancelOrder = async (orderId: string): Promise<void> => {
    // Only allow admins or order owners to cancel orders
    const loggedInUser = await getLoggedInUser();
    const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { user_id: true, status: true },
    });
    if (!loggedInUser) throw new Error("User must be logged in to cancel an order");
    if (!(loggedInUser.role === UserRole.admin || loggedInUser.id === order.user_id))
        throw new Error("User does not have permission to cancel this order");

    // Only allow cancelling pending orders
    if (order.status !== OrderStatus.pending)
        throw new Error("Only pending orders can be cancelled");

    await prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.cancelled },
    });
    revalidateTag(GlobalConstants.ORDER, "max");
};

export const deleteOrder = async (orderId: string): Promise<void> => {
    const validatedOrderId = UuidSchema.parse(orderId);
    const loggedInUser = await getLoggedInUser();
    const order = await prisma.order.findUniqueOrThrow({
        where: { id: validatedOrderId },
        select: { user_id: true },
    });
    if (!loggedInUser) throw new Error("User must be logged in to delete an order");
    if (!(loggedInUser.role === UserRole.admin || loggedInUser.id === order.user_id))
        throw new Error("User does not have permission to delete this order");

    await prisma.order.delete({
        where: { id: validatedOrderId },
    });

    revalidateTag(GlobalConstants.ORDER, "max");
};
