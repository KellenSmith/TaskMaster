"use server";

import { prisma, TransactionClient } from "../../prisma/prisma-client";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import { isUserAdmin, serverRedirect } from "./utils";
import { UuidSchema } from "./zod-schemas";
import { getLoggedInUser } from "./user-helpers";
import { validateAndBuildOrderItems } from "./order-item-helpers";
import { OrderStatus, UserRole } from "../../prisma/generated/enums";
import { Prisma } from "../../prisma/generated/client";
import { connection } from "next/server";
import { checkPaymentStatus } from "./payment-actions";
import { createElement } from "react";
import { sendMail } from "./mail-service/mail-service";
import OrderPaymentConfirmationTemplate from "./mail-service/mail-templates/OrderPaymentConfirmationTemplate";

export const getOrderCacheTag = async (orderId: string) => `${GlobalConstants.ORDER}:${orderId}`;

export const createAndRedirectToOrder = async (
    orderItems: Prisma.OrderItemCreateManyOrderInput[],
): Promise<void> => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error("User must be logged in to create an order");

    await connection();
    const createdOrder = await prisma.$transaction(async (tx: TransactionClient) => {
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
    const parsedOrderId = UuidSchema.parse(orderId);
    // Only allow admins or order owners to cancel orders
    const loggedInUser = await getLoggedInUser();
    const order = await prisma.order.findUniqueOrThrow({
        where: { id: parsedOrderId },
        select: { user_id: true, status: true },
    });
    if (!loggedInUser) throw new Error("User must be logged in to cancel an order");
    if (!(loggedInUser.role === UserRole.admin || loggedInUser.id === order.user_id))
        throw new Error("User does not have permission to cancel this order");

    // Only allow cancelling pending orders
    if (order.status !== OrderStatus.pending)
        throw new Error("Only pending orders can be cancelled");

    await prisma.order.update({
        where: { id: parsedOrderId },
        data: { status: OrderStatus.cancelled },
    });
    revalidateTag(GlobalConstants.ORDER, "max");
    revalidateTag(await getOrderCacheTag(parsedOrderId), "max");
};

export const userConfirmOrderPayment = async (orderId: string): Promise<void> => {
    const parsedOrderId = UuidSchema.parse(orderId);
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error("User must be logged in to confirm payment");

    const order = await prisma.order.findUniqueOrThrow({
        where: { id: parsedOrderId },
        select: {
            id: true,
            user_id: true,
            status: true,
            total_amount: true,
            total_vat_amount: true,
        },
    });

    if (!isUserAdmin(loggedInUser) || loggedInUser.id !== order.user_id)
        throw new Error("User does not have permission to confirm payment for this order");

    // Only allow confirming payment for pending orders
    if (order.status !== OrderStatus.pending)
        throw new Error("Only pending orders can be confirmed for payment");

    await prisma.order.update({
        where: { id: parsedOrderId },
        data: { status: OrderStatus.payment_confirmed },
    });

    // Send notification to admins to review the payment and progress the order
    try {
        const mailContent = createElement(OrderPaymentConfirmationTemplate, { order });
        const result = await sendMail(
            [process.env.EMAIL as string],
            `Order payment confirmation received`,
            mailContent,
        );
        if (result.fallbackJobId) {
            console.log(
                `Order confirmation queued as newsletter job ${result.fallbackJobId} due to rate limiting`,
            );
        }
    } catch (error) {
        // Allow progressing order despite failed confirmation
        console.error("Failed to send order payment confirmation notification:", error);
    }

    revalidateTag(GlobalConstants.ORDER, "max");
    revalidateTag(await getOrderCacheTag(parsedOrderId), "max");
};

export const markAsPaid = async (orderId: string): Promise<void> => {
    const parsedOrderId = UuidSchema.parse(orderId);
    // Only allow admins to mark orders as paid
    const loggedInUser = await getLoggedInUser();
    if (!isUserAdmin(loggedInUser))
        throw new Error("User does not have permission to mark this order as paid");

    const order = await prisma.order.findUniqueOrThrow({
        where: { id: parsedOrderId },
        select: { user_id: true, status: true },
    });

    // Only allow marking pending orders as paid
    if (order.status !== OrderStatus.payment_confirmed)
        throw new Error("Only orders with payment confirmed can be marked as paid");

    await prisma.order.update({
        where: { id: parsedOrderId },
        data: { status: OrderStatus.paid },
    });

    checkPaymentStatus(loggedInUser!.id, parsedOrderId); // Progress order after marking as paid
    revalidateTag(GlobalConstants.ORDER, "max");
    revalidateTag(await getOrderCacheTag(parsedOrderId), "max");
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
    revalidateTag(await getOrderCacheTag(validatedOrderId), "max");
};
