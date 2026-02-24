"use server";

import { prisma } from "../../prisma/prisma-client";
import { isUserAdmin } from "./utils";
import { getLoggedInUser } from "./user-actions";
import { UuidSchema } from "./zod-schemas";
import { progressOrder } from "./order-helpers";
import { isOrderpaid, redirectToSwedbankPayment } from "./payment-helpers";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { OrderStatus } from "../../prisma/generated/enums";

export const redirectToOrderPayment = async (orderId: string): Promise<void> => {
    const validatedOrderId = UuidSchema.parse(orderId);

    const order = await prisma.order.findUniqueOrThrow({
        where: { id: validatedOrderId },
        include: {
            user: true,
            order_items: { include: { product: { include: { membership: true } } } },
        },
    });

    // Only allow paying for own orders
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser || order.user_id !== loggedInUser.id) {
        throw new Error("Unauthorized to pay for this order");
    }
    // Only allow payment for pending orders
    if (order.status !== OrderStatus.pending) {
        throw new Error("Only pending orders can be paid for");
    }
    // Free order - no payment needed - process immediately
    if (order.total_amount === 0) {
        await progressOrder(order, false);
        revalidateTag(GlobalConstants.ORDER, "max");
        return;
    }

    await redirectToSwedbankPayment(order);
};

export const checkPaymentStatus = async (userId: string, orderId: string): Promise<void> => {
    const validatedUserId = UuidSchema.parse(userId);
    const validatedOrderId = UuidSchema.parse(orderId);

    const order = await prisma.order.findUniqueOrThrow({
        where: { id: validatedOrderId },
        include: {
            user: true,
            order_items: {
                include: {
                    product: { include: { membership: true, ticket: true } },
                },
            },
        },
    });

    // Only allow admins to check other users' orders
    const loggedInUser = await getLoggedInUser();
    if (!isUserAdmin(loggedInUser) && order.user_id !== validatedUserId) {
        throw new Error("Unauthorized to check payment status for this order");
    }
    // Do nothing to cancelled or completed orders
    if (order.status === OrderStatus.cancelled || order.status === OrderStatus.completed) {
        return;
    }
    // If the order is free, complete it immediately.
    if (order.total_amount === 0) {
        await progressOrder(order, false);
        revalidateTag(GlobalConstants.ORDER, "max");
        return;
    }
    if (!order.payment_request_id) {
        // This should not happen - an order without payment request ID is either pending,
        // cancelled or free which are handled above. Log and throw error if it does.
        if (order.status !== OrderStatus.pending)
            throw new Error("No payment initiated for non-pending order");
        // No payment initiated, nothing to check
        return;
    }

    const { isPaid, needsCapture } = await isOrderpaid(order);

    if (isPaid) await progressOrder(order, needsCapture);
    revalidateTag(GlobalConstants.ORDER, "max");
};
