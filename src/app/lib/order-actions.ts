"use server";

import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import { processOrderedProduct } from "./product-actions";
import { sendOrderConfirmation } from "./mail-service/mail-service";
import GlobalConstants from "../GlobalConstants";
import { capturePaymentFunds } from "./payment-actions";
import { revalidateTag } from "next/cache";
import { serverRedirect } from "./utils";
import { UuidSchema } from "./zod-schemas";
import { SubscriptionToken } from "./payment-utils";

export const getOrderById = async (
    userId: string,
    orderId: string,
): Promise<
    Prisma.OrderGetPayload<{
        include: { order_items: { include: { product: { include: { membership: true } } } } };
    }>
> => {
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
    if (userId !== order.user_id) throw new Error("Not authorized to view this order");
    return order;
};

export const getAllOrders = async (): Promise<
    Prisma.OrderGetPayload<{
        include: {
            user: { select: { nickname: true } };
            order_items: { include: { product: true } };
        };
    }>[]
> => {
    return prisma.order.findMany({
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

export const createOrder = async (
    tx: Prisma.TransactionClient,
    userId: string,
    orderItems: Prisma.OrderItemCreateManyOrderInput[],
): Promise<Prisma.OrderGetPayload<true>> => {
    // Check that the stock of each product in the orderItems is sufficient
    for (const orderItem of orderItems) {
        const product = await tx.product.findUniqueOrThrow({
            where: { id: orderItem.product_id },
        });
        if (!product.unlimited_stock && product.stock < orderItem.quantity) {
            throw new Error(`Insufficient stock for product ${product.id}`);
        }
    }

    // Calculate the price of each order item
    for (const item of orderItems) {
        const product = await tx.product.findUniqueOrThrow({
            where: { id: item.product_id },
        });
        item.price = product.price * item.quantity;
    }

    // Create the order with items in a transaction
    const order = await tx.order.create({
        data: {
            total_amount: orderItems.reduce((acc, item) => item.price * item.quantity + acc, 0),
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
    return order;
};

export const createAndRedirectToOrder = async (
    userId: string,
    orderItems: Prisma.OrderItemCreateManyOrderInput[],
): Promise<void> => {
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) =>
        await createOrder(tx, userId, orderItems)
    );
    revalidateTag(GlobalConstants.ORDER);
    serverRedirect([GlobalConstants.ORDER], { [GlobalConstants.ORDER_ID]: order.id });
};

const processOrderItems = async (
    orderId: string,
): Promise<void> => {
    const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
            order_items: {
                include: {
                    product: { include: { membership: true, ticket: true } },
                },
            },
        },
    });
    if (order.order_items?.length === 0) {
        throw new Error("No items found for this order");
    }

    // Process each order item
    for (const orderItem of order.order_items) {
        await processOrderedProduct(order.user_id, orderItem);
    }
};

export const progressOrder = async (
    orderId: string,
    newStatus: OrderStatus,
    needsCapture = false,
): Promise<void> => {
    // Always allow transitioning to cancelled or error
    if (([OrderStatus.cancelled, OrderStatus.error] as string[]).includes(newStatus)) {
        await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus },
        });
        revalidateTag(GlobalConstants.ORDER);
        return;
    }

    let order: Prisma.OrderGetPayload<true> = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { status: true }
    });

    // Pending to paid
    if (order.status === OrderStatus.pending) {
        order = await prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.paid },
            select: { status: true }
        });
        revalidateTag(GlobalConstants.ORDER);
    }

    // Paid to shipped
    if (order.status === OrderStatus.paid) {
        // This transaction may perform multiple updates and external work; increase timeout locally.
        await prisma.$transaction(
            async (tx: Prisma.TransactionClient) => {
                await processOrderItems(orderId);
                order = await prisma.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.shipped },
                    select: { status: true }
                });
                revalidateTag(GlobalConstants.ORDER);
            }
        );
        try {
            await sendOrderConfirmation(orderId);
        } catch (error) {
            // Allow progressing order despite failed confirmation
            console.error("Failed to send order confirmation:", error);
        }
    }
    // Shipped to completed
    if (order.status === OrderStatus.shipped) {
        if (needsCapture) await capturePaymentFunds(orderId);
        order = await prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.completed },
            select: { status: true }
        });
        revalidateTag(GlobalConstants.ORDER);
    }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
    const validatedOrderId = UuidSchema.parse(orderId);

    await prisma.order.delete({
        where: { id: validatedOrderId },
    });
};
