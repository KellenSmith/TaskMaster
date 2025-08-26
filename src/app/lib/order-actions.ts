"use server";

import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import { processOrderedProduct } from "./product-actions";
import { sendOrderConfirmation } from "./mail-service/mail-service";
import GlobalConstants from "../GlobalConstants";
import { capturePaymentFunds } from "./payment-actions";
import { revalidateTag } from "next/cache";
import { serverRedirect } from "./definitions";
import { getLoggedInUser } from "./user-actions";

export const getOrderById = async (
    orderId: string,
): Promise<
    Prisma.OrderGetPayload<{
        include: { orderItems: { include: { product: true } } };
    }>
> => {
    try {
        const order = await prisma.order.findUniqueOrThrow({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        const user = await getLoggedInUser();
        if (user.id === order.userId) return order;
    } catch {
        throw new Error("Failed to fetch order");
    }
};

export const getAllOrders = async (): Promise<
    Prisma.OrderGetPayload<{
        include: {
            user: { select: { nickname: true } };
            orderItems: { include: { product: true } };
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
                orderItems: {
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
    orderItems: Prisma.OrderItemCreateManyOrderInput[],
): Promise<void> => {
    let createdOrderId: string;
    try {
        const loggedInUser = await getLoggedInUser();

        // Calculate the price of each order item
        for (const item of orderItems) {
            const product = await prisma.product.findUniqueOrThrow({
                where: { id: item.productId },
            });
            item.price = product.price * item.quantity;
        }

        // Create the order with items in a transaction
        const order = await prisma.$transaction(async (tx) => {
            return await tx.order.create({
                data: {
                    totalAmount: orderItems.reduce(
                        (acc, item) => item.price * item.quantity + acc,
                        0,
                    ),
                    user: {
                        connect: {
                            id: loggedInUser.id,
                        },
                    },
                    orderItems: {
                        createMany: {
                            data: orderItems,
                        },
                    },
                },
            });
        });
        createdOrderId = order.id;
    } catch {
        throw new Error("Failed to create order");
    }
    serverRedirect([GlobalConstants.ORDER], { [GlobalConstants.ORDER_ID]: createdOrderId });
};

const processOrderItems = async (orderId: string): Promise<void> => {
    try {
        const order = await prisma.order.findUniqueOrThrow({
            where: { id: orderId },
            include: {
                orderItems: {
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

        if (order.orderItems.length === 0) {
            throw new Error("No items found for this order");
        }

        // Process each order item
        for (const orderItem of order.orderItems) {
            await processOrderedProduct(order.userId, orderItem);
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
                where: { orderId },
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
