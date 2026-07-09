"use server";

import { prisma } from "../../prisma/prisma-client";
import { isUserAdmin } from "./utils";
import { getLoggedInUser, getUserLanguage } from "./user-helpers";
import { UuidSchema } from "./zod-schemas";
import { progressOrder } from "./order-helpers";
import { isOrderpaid, redirectToSwedbankPayment, isSwedbankPayConfigured } from "./payment-helpers";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { OrderStatus } from "../../prisma/generated/enums";
import LanguageTranslations from "./LanguageTranslations";

export const redirectToOrderPayment = async (orderId: string): Promise<string | undefined> => {
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
        return LanguageTranslations.unauthorized[await getUserLanguage()];
    }
    // Only allow payment for pending orders
    if (order.status !== OrderStatus.pending) {
        return LanguageTranslations.onlyPendingOrders[await getUserLanguage()];
    }
    // Free order - no payment needed - process immediately
    if (order.total_amount === 0) {
        await progressOrder(order, false);
        revalidateTag(GlobalConstants.ORDER, "max");
        return;
    }

    if (!isSwedbankPayConfigured())
        return LanguageTranslations.swedbankPayNotConfigured[await getUserLanguage()];

    await redirectToSwedbankPayment(order);
};

export const checkPaymentStatus = async (
    userId: string,
    orderId: string,
): Promise<string | undefined> => {
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
        return LanguageTranslations.unauthorized[await getUserLanguage()];
    }
    // Do nothing to payment confirmed, cancelled or completed orders
    if (order.status === OrderStatus.cancelled || order.status === OrderStatus.completed) {
        return;
    }

    // If the order is free or manually marked as paid, complete it immediately.
    if (order.total_amount === 0 || order.status === OrderStatus.paid) {
        await progressOrder(order, false);
        revalidateTag(GlobalConstants.ORDER, "max");
        return;
    }

    if (!order.payment_request_id) {
        // This should not happen - an order without payment request ID is either pending,
        // cancelled or free which are handled above. Log and throw error if it does.
        if (order.status !== OrderStatus.pending && order.status !== OrderStatus.payment_confirmed)
            return LanguageTranslations.noPaymentInitiated[await getUserLanguage()];
        // No payment initiated, nothing to check
        return;
    }

    const { isPaid, needsCapture } = await isOrderpaid(order);

    if (isPaid) {
        revalidateTag(GlobalConstants.ORDER, "max");
        await progressOrder(order, needsCapture);
    }
};
