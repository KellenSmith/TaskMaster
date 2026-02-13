"use server";

import dayjs from "dayjs";
import { OrderStatus, Prisma } from "../../prisma/generated/browser";

export const getAvailableProductStock = (
    product: Prisma.ProductGetPayload<{
        select: {
            stock: true;
            order_items: {
                select: { quantity: true; order: { select: { status: true; created_at: true } } };
            };
        };
    }>,
): number | null => {
    if (product.stock === null) return null; // Infinite stock

    const reservedStock = product.order_items.reduce((acc, item) => {
        if (
            item.order.status === OrderStatus.pending &&
            dayjs.utc(item.order.created_at).isAfter(dayjs.utc().subtract(30, "minute"))
        )
            return acc + item.quantity;
        return acc;
    }, 0);

    if (reservedStock >= product.stock) return 0;

    return product.stock - reservedStock;
};
