"use server";

import { Prisma } from "../../prisma/generated/client";
import { getAvailableProductStock } from "./product-helpers";
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
