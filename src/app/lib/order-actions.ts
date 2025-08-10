"use server";

import { OrderStatus } from "@prisma/client";
import { prisma } from "../../prisma/prisma-client";
import { getMembershipProductId, processOrderedProduct } from "./product-actions";
import { getLoggedInUser } from "./user-actions";
import { DatagridActionState, FormActionState } from "./definitions";
import { sendOrderConfirmation } from "./mail-service/mail-service";
import { capturePaymentFunds } from "./payment-actions";

type CreateOrderItemInput = {
    [productId: string]: number; // productId: quantity
};

export const getOrderById = async (
    currentState: DatagridActionState,
    orderId: string,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
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
        newActionState.status = 200;
        newActionState.result = [order];
        newActionState.errorMsg = "";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};

export const getAllOrders = async (
    currentState: DatagridActionState,
): Promise<DatagridActionState> => {
    const newActionState: DatagridActionState = { ...currentState };
    try {
        const orders = await prisma.order.findMany({
            include: {
                orderItems: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        newActionState.status = 200;
        newActionState.result = orders;
        newActionState.errorMsg = "";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = [];
    }
    return newActionState;
};

export const createOrder = async (
    currentActionState: FormActionState,
    orderItems: CreateOrderItemInput,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        let totalAmount = 0;

        // First fetch all products to validate they exist and get their prices
        const productIds = Object.keys(orderItems);
        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
        });

        // Validate all products exist and calculate total
        if (products.length !== productIds.length) {
            throw new Error("Some products not found");
        }

        // Get the logged-in user
        const loggedInUserResult = await getLoggedInUser(currentActionState);
        if (loggedInUserResult.status !== 200) {
            throw new Error(loggedInUserResult.errorMsg || "Failed to get logged-in user");
        }
        const loggedInUser = JSON.parse(loggedInUserResult.result as string);

        // Create the order with items in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create the order first
            const order = await tx.order.create({
                data: {
                    userId: loggedInUser.id,
                    status: "pending",
                    totalAmount: 0, // We'll update this after creating items
                },
            });

            // Create order items and calculate total
            const orderItemsPromises = products.map(async (product) => {
                const quantity = orderItems[product.id];
                const itemPrice = product.price * quantity;
                totalAmount += itemPrice;

                return tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: product.id,
                        quantity,
                        price: itemPrice,
                    },
                });
            });

            await Promise.all(orderItemsPromises);

            // Update order with final total
            return tx.order.update({
                where: { id: order.id },
                data: { totalAmount },
            });
        });

        newActionState.errorMsg = "";
        newActionState.status = 201;
        newActionState.result = order.id;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

const processOrderItems = async (
    orderId: string,
    currentActionState: FormActionState,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const order = await prisma.order.findUniqueOrThrow({
            where: { id: orderId },
            select: {
                userId: true,
            },
        });
        const orderItems = await prisma.orderItem.findMany({
            where: { orderId },
        });

        if (orderItems.length === 0) {
            throw new Error("No items found for this order");
        }

        // Process each order item
        for (const item of orderItems) {
            await processOrderedProduct(
                item.productId,
                item.quantity,
                order.userId,
                currentActionState,
            );
        }
        await prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.completed }, // Update order status to completed
        });
        newActionState.status = 200;
        newActionState.errorMsg = "";
        newActionState.result = "Order items processed successfully";
        return newActionState;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const updateOrderStatus = async (
    orderId: string,
    currentActionState: FormActionState,
    status: OrderStatus,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };

    try {
        const order = await prisma.order.findUniqueOrThrow({
            where: { id: orderId },
            select: {
                status: true,
            },
        });

        // Don't update from completed status to any other status
        if (order.status === OrderStatus.completed) {
            newActionState.status = 200;
            newActionState.result = `Order is already completed and cannot be updated`;
            newActionState.errorMsg = "";
            return newActionState;
        }

        if (order.status === status) {
            newActionState.status = 200;
            newActionState.result = `Order is already in status: ${status}`;
            newActionState.errorMsg = "";
            return newActionState;
        }

        // Always update the order to the requested status first
        await prisma.order.update({
            where: { id: orderId },
            data: { status },
        });

        // If status is paid, attempt to process order items
        if (status === OrderStatus.paid) {
            const processedItemsResult = await processOrderItems(orderId, currentActionState);
            if (processedItemsResult.status === 200) {
                // Processing succeeded - update to shipped
                await prisma.order.update({
                    where: { id: orderId },
                    data: { status: OrderStatus.shipped },
                });

                await sendOrderConfirmation(orderId);

                newActionState.errorMsg = "";
                newActionState.status = 200;
                newActionState.result = "Order completed";
            } else {
                // Processing failed - order remains as paid, return processing error
                newActionState.status = processedItemsResult.status;
                newActionState.errorMsg = processedItemsResult.errorMsg;
                newActionState.result = "";
                return newActionState;
            }
        } else {
            // For any other status, just confirm the update
            newActionState.status = 200;
            newActionState.errorMsg = "";
            newActionState.result = `Order updated to ${status}`;
        }
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
        return newActionState;
    }
    return newActionState;
};

export const deleteOrder = async (
    orderId: string,
    currentActionState: FormActionState,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
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
        newActionState.errorMsg = "";
        newActionState.status = 200;
        newActionState.result = "Order deleted successfully";
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
    }
    return newActionState;
};

export const createMembershipOrder = async (
    currentActionState: FormActionState,
): Promise<FormActionState & { orderId?: string }> => {
    const newActionState = { ...currentActionState };
    try {
        // Get or create the membership product
        const membershipProductId = await getMembershipProductId();

        // Create order using existing createOrder function
        const orderResult = await createOrder(currentActionState, {
            [membershipProductId]: 1, // One membership
        });

        if (orderResult.status !== 201 || !orderResult.result) {
            throw new Error(orderResult.errorMsg || "Failed to create membership order");
        }

        return orderResult;
    } catch (error) {
        newActionState.status = 500;
        newActionState.errorMsg = error.message;
        newActionState.result = "";
        return newActionState;
    }
};
