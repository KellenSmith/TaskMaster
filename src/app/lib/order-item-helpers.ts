"use server";

import { Prisma } from "../../prisma/generated/client";
import { getAvailableProductStock, processOrderedProduct } from "./product-helpers";
import { UuidSchema } from "./zod-schemas";

export const validateAndBuildOrderItems = async (
    tx: Prisma.TransactionClient,
    orderItems: Prisma.OrderItemCreateManyOrderInput[],
): Promise<Prisma.OrderItemCreateManyOrderInput[]> => {
    // Fetch all products in a single query for efficiency
    const validatedProductIds = new Set<string>(
        orderItems.map((item) => UuidSchema.parse(item.product_id)),
    );
    const products = await tx.product.findMany({
        where: { id: { in: Array.from(validatedProductIds) } },
        select: {
            id: true,
            stock: true,
            price: true,
            vat_percentage: true,
            order_items: {
                select: {
                    quantity: true,
                    order: { select: { status: true, created_at: true } },
                },
            },
        },
    });

    const validatedOrderItems: Prisma.OrderItemCreateManyOrderInput[] = [];
    for (const orderItem of orderItems) {
        // Product id has already been validated and parsed, so we can safely cast it
        const product = products.find((p) => p.id === orderItem.product_id);
        if (!product) throw new Error(`Product with id ${orderItem.product_id} not found`);

        // Check that the stock of each product in the orderItems is valid and sufficient
        const availableStock = getAvailableProductStock(product);
        if (
            !orderItem.quantity ||
            typeof orderItem.quantity !== "number" ||
            orderItem.quantity <= 0
        )
            throw new Error(`Invalid quantity for product ${product.id}`);
        if (availableStock !== null && availableStock < orderItem.quantity)
            throw new Error(`Insufficient stock for product ${product.id}`);

        // Calculate the price of each order item
        orderItem.price = product.price;
        orderItem.vat_amount = (product.vat_percentage / 100) * product.price;
        validatedOrderItems.push(orderItem);
    }
    return validatedOrderItems;
};

export const processOrderItems = async (
    tx: Prisma.TransactionClient,
    order: Prisma.OrderGetPayload<{
        select: {
            id: true;
            status: true;
            user_id: true;
            order_items: { include: { product: { include: { membership: true; ticket: true } } } };
        };
    }>,
): Promise<void> => {
    if (order.order_items.length === 0) throw new Error(`No items found for order ${order.id}`);
    if (!order.user_id) throw new Error(`Order ${order.id} has no associated user`);

    // Process each order item
    for (const orderItem of order.order_items) {
        await processOrderedProduct(tx, order.user_id, orderItem);
    }
};
