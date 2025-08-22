"use server";

import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { processOrderedProduct } from "./product-actions";
import { getLoggedInUser } from "./user-actions";
import { sendOrderConfirmation } from "./mail-service/mail-service";
import { redirect } from "next/navigation";
import { NextURL } from "next/dist/server/web/next-url";
import GlobalConstants from "../GlobalConstants";
import { capturePaymentFunds } from "./payment-actions";
import z from "zod";
import { OrderUpdateSchema } from "./zod-schemas";

export const getOrderById = async (
    orderId: string,
): Promise<Prisma.OrderGetPayload<{ include: { orderItems: { include: { product: true } } } }>> => {
    try {
        return await prisma.order.findUniqueOrThrow({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    } catch {
        throw new Error("Failed to fetch order");
    }
};

export type AllOrdersType = Prisma.OrderGetPayload<{
    include: {
        user: { select: { nickname: true } };
        orderItems: { include: { product: true } };
    };
}>;

export const getAllOrders = async (): Promise<AllOrdersType[]> => {
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
    } catch (error) {
        throw new Error("Failed to fetch orders");
    }
};

export const createOrder = async (
    orderItems: Prisma.OrderItemCreateManyOrderInput[],
): Promise<void> => {
    let redirectUrl: string;
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
        const orderUrl = new NextURL(`/${GlobalConstants.ORDER}`, process.env.VERCEL_URL);
        orderUrl.searchParams.set(GlobalConstants.ORDER_ID, order.id);
        redirectUrl = orderUrl.toString();
    } catch (error) {
        throw new Error("Failed to create order");
    }
    redirect(redirectUrl);
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
    } catch (error) {
        throw new Error(`Failed to process order items`);
    }
};

// Only allow progression of orders, not regression
const isStatusTransitionValid = (orderStatus: OrderStatus, newStatus: OrderStatus) =>
    Object.keys(OrderStatus).indexOf(orderStatus) <= Object.keys(OrderStatus).indexOf(newStatus);

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
            return;
        }

        let order: Prisma.OrderGetPayload<true> = await prisma.order.findUniqueOrThrow({
            where: { id: orderId },
        });

        if (!isStatusTransitionValid(order.status, newStatus)) {
            throw new Error("Invalid order status transition");
        }

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
        }
        // Shipped to completed
        if (order.status === OrderStatus.shipped) {
            await sendOrderConfirmation(orderId);
            needsCapture && (await capturePaymentFunds(orderId));
            order = await prisma.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.completed },
            });
        }
    } catch {
        throw new Error("Failed to progress order");
    }
};

export const updateOrder = async (
    orderId: string,
    parsedFieldValues: z.infer<typeof OrderUpdateSchema>,
): Promise<void> => {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: parsedFieldValues,
        });
    } catch {
        throw new Error("Failed updating order");
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
    } catch (error) {
        throw new Error("Failed to delete order");
    }
};
