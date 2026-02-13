"use server";

import { OrderStatus, Prisma, UserRole } from "@/prisma/generated/client";
import { prisma } from "../../prisma/prisma-client";
import { processOrderedProduct } from "./product-actions";
import { sendOrderConfirmation } from "./mail-service/mail-service";
import GlobalConstants from "../GlobalConstants";
import { capturePaymentFunds } from "./payment-actions";
import { revalidateTag } from "next/cache";
import { serverRedirect } from "./utils";
import { UuidSchema } from "./zod-schemas";
import { getLoggedInUser } from "./user-actions";

export const createOrder = async (
    userId: string,
    orderItems: Prisma.OrderItemCreateManyOrderInput[],
): Promise<Prisma.OrderGetPayload<true>> => {
    // Check that the stock of each product in the orderItems is sufficient
    for (const orderItem of orderItems) {
        const product = await prisma.product.findUniqueOrThrow({
            where: { id: orderItem.product_id },
        });
        if (!orderItem.quantity) throw new Error(`Invalid quantity for product ${product.id}`);
        if (product.stock && product.stock < orderItem.quantity)
            throw new Error(`Insufficient stock for product ${product.id}`);
    }

    // Calculate the price of each order item
    for (const item of orderItems) {
        const product = await prisma.product.findUniqueOrThrow({
            where: { id: item.product_id },
        });
        item.price = product.price;
        item.vat_amount = (product.vat_percentage / 100) * product.price;
    }

    // Create the order with items in a transaction
    // OrderItem price, vat and quantity have been validated at this point
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        return await tx.order.create({
            data: {
                total_amount: orderItems.reduce(
                    (acc, item) => (item.price as number) * (item.quantity as number) + acc,
                    0,
                ),
                total_vat_amount: orderItems.reduce(
                    (acc, item) => (item.vat_amount as number) * (item.quantity as number) + acc,
                    0,
                ),
                user: {
                    connect: {
                        id: userId,
                    },
                },
                order_items: {
                    createMany: {
                        data: orderItems,
                    },
                },
            },
        });
    });
    return order;
};

export const createAndRedirectToOrder = async (
    userId: string,
    orderItems: Prisma.OrderItemCreateManyOrderInput[],
): Promise<void> => {
    const order = await createOrder(userId, orderItems);
    serverRedirect([GlobalConstants.ORDER], { [GlobalConstants.ORDER_ID]: order.id });
};

const processOrderItems = async (tx: Prisma.TransactionClient, orderId: string): Promise<void> => {
    const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
            order_items: {
                include: {
                    product: {
                        include: {
                            membership: true,
                            ticket: true,
                        },
                    },
                },
            },
        },
    });

    if (order.order_items.length === 0) throw new Error(`No items found for order ${order.id}`);
    if (!order.user_id) throw new Error(`Order ${order.id} has no associated user`);

    // Process each order item
    for (const orderItem of order.order_items) {
        await processOrderedProduct(tx, order.user_id, orderItem);
    }
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

export const progressOrder = async (
    orderId: string,
    newStatus: OrderStatus,
    needsCapture = false,
): Promise<void> => {
    let order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { status: true },
    });

    // Pending to paid
    if (order.status === OrderStatus.pending) {
        order = await prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.paid },
            select: { status: true },
        });
        revalidateTag(GlobalConstants.ORDER, "max");
        if (newStatus === OrderStatus.paid) return;
    }

    // Paid to shipped
    if (order.status === OrderStatus.paid) {
        // This transaction may perform multiple updates and external work; increase timeout locally.
        await prisma.$transaction(
            async (tx: Prisma.TransactionClient) => {
                await processOrderItems(tx, orderId);
                order = await prisma.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.shipped },
                    select: { status: true },
                });
                revalidateTag(GlobalConstants.ORDER, "max");
            },
            {
                // timeout in ms for this interactive transaction; set to 30s for safety
                timeout: 10000,
                // max wait to acquire a connection for transaction
                maxWait: 5000,
            },
        );
        try {
            await sendOrderConfirmation(orderId);
        } catch (error) {
            // Allow progressing order despite failed confirmation
            console.error("Failed to send order confirmation:", error);
        }
        if (newStatus === OrderStatus.shipped) return;
    }
    // Shipped to completed
    if (order.status === OrderStatus.shipped) {
        if (needsCapture) await capturePaymentFunds(orderId);
        await prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.completed },
        });
        revalidateTag(GlobalConstants.ORDER, "max");
    }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
    const validatedOrderId = UuidSchema.parse(orderId);

    await prisma.order.delete({
        where: { id: validatedOrderId },
    });
};
