"use server";

import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import { processOrderedProduct } from "./product-actions";
import { sendOrderConfirmation } from "./mail-service/mail-service";
import GlobalConstants from "../GlobalConstants";
import { capturePaymentFunds } from "./payment-actions";
import { revalidateTag } from "next/cache";
import { serverRedirect } from "./definitions";

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
    try {
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
    } catch {
        throw new Error("Failed to fetch orders");
    }
};

export const createOrder = async (
    userId: string,
    orderItems: Prisma.OrderItemCreateManyOrderInput[],
): Promise<void> => {
    // Check that the stock of each product in the orderItems is sufficient
    for (const orderItem of orderItems) {
        const product = await prisma.product.findUniqueOrThrow({
            where: { id: orderItem.product_id },
        });
        if (!product.unlimited_stock && product.stock < orderItem.quantity) {
            throw new Error(`Insufficient stock for product ${product.id}`);
        }
    }

    // Calculate the price of each order item
    for (const item of orderItems) {
        const product = await prisma.product.findUniqueOrThrow({
            where: { id: item.product_id },
        });
        item.price = product.price * item.quantity;
    }

    // Create the order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
        return await tx.order.create({
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
    });
    serverRedirect([GlobalConstants.ORDER], { [GlobalConstants.ORDER_ID]: order.id });
};

const processOrderItems = async (orderId: string): Promise<void> => {
    try {
        const order = await prisma.order.findUniqueOrThrow({
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

        if (order.order_items.length === 0) {
            throw new Error("No items found for this order");
        }

        // Process each order item
        for (const orderItem of order.order_items) {
            await processOrderedProduct(order.user_id, orderItem);
        }
    } catch {
        throw new Error(`Failed to process order items`);
    }
};

export const progressOrder = async (
    orderId: string,
    newStatus: OrderStatus,
    needsCapture = false,
): Promise<void> => {
    try {
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
        });

        // Pending to paid
        if (order.status === OrderStatus.pending) {
            order = await prisma.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.paid },
            });
        }
        // Paid to shipped
        if (order.status === OrderStatus.paid) {
            await processOrderItems(orderId);
            order = await prisma.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.shipped },
            });
            await sendOrderConfirmation(orderId);
        }
        // Shipped to completed
        if (order.status === OrderStatus.shipped) {
            needsCapture && (await capturePaymentFunds(orderId));
            order = await prisma.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.completed },
            });
        }
        revalidateTag(GlobalConstants.ORDER);
    } catch {
        throw new Error("Failed to progress order");
    }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
    try {
        await prisma.$transaction(async (tx) => {
            // Delete all order items first
            await tx.orderItem.deleteMany({
                where: { order_id: orderId },
            });
            // Then delete the order
            await tx.order.delete({
                where: { id: orderId },
            });
        });
    } catch {
        throw new Error("Failed to delete order");
    }
};
