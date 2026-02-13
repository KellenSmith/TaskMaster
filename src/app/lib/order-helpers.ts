"use server";

import { revalidateTag } from "next/cache";
import { OrderStatus, Prisma } from "../../prisma/generated/client";
import { prisma } from "../../prisma/prisma-client";
import { sendOrderConfirmation } from "./mail-service/mail-service";
import { capturePaymentFunds } from "./payment-helpers";
import GlobalConstants from "../GlobalConstants";
import { processOrderItems } from "./order-item-helpers";

export const progressOrder = async (
    order: Prisma.OrderGetPayload<{
        include: {
            user: true;
            order_items: { include: { product: { include: { membership: true; ticket: true } } } };
        };
    }>,
    needsCapture = false,
): Promise<void> => {
    switch (order.status) {
        case OrderStatus.pending:
            await pendingOrderToPaid(order, needsCapture);
            break;
        case OrderStatus.paid:
            await paidOrderToShipped(order, needsCapture);
            break;
        case OrderStatus.shipped:
            await shippedOrderToCompleted(order, needsCapture);
            break;
        default:
            throw new Error(`Cannot progress order with status ${order.status}`);
    }

    revalidateTag(GlobalConstants.ORDER, "max");
};

export const pendingOrderToPaid = async (
    order: Prisma.OrderGetPayload<{
        include: {
            user: true;
            order_items: { include: { product: { include: { membership: true; ticket: true } } } };
        };
    }>,
    needsCapture: boolean,
): Promise<void> => {
    if (order.status !== OrderStatus.pending)
        throw new Error(`An order with status ${order.status} cannot be marked as paid`);

    await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.paid },
    });

    await paidOrderToShipped(order, needsCapture);
};

export const paidOrderToShipped = async (
    order: Prisma.OrderGetPayload<{
        include: {
            user: true;
            order_items: { include: { product: { include: { membership: true; ticket: true } } } };
        };
    }>,
    needsCapture: boolean,
): Promise<void> => {
    if (order.status !== OrderStatus.paid)
        throw new Error(`An order with status ${order.status} cannot be marked as shipped`);

    // This transaction may perform multiple updates and external work; increase timeout locally.
    await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
            await processOrderItems(tx, order);
            await tx.order.update({
                where: { id: order.id },
                data: { status: OrderStatus.shipped },
                select: { id: true, status: true },
            });
        },
        {
            // timeout in ms for this interactive transaction; set to 30s for safety
            timeout: 10000,
            // max wait to acquire a connection for transaction
            maxWait: 5000,
        },
    );
    try {
        await sendOrderConfirmation(order);
    } catch (error) {
        // Allow progressing order despite failed confirmation
        console.error("Failed to send order confirmation:", error);
    }

    await shippedOrderToCompleted(order, needsCapture);
};

export const shippedOrderToCompleted = async (
    order: Prisma.OrderGetPayload<true>,
    needsCapture: boolean,
) => {
    if (needsCapture) await capturePaymentFunds(order);
    await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.completed },
    });
};
