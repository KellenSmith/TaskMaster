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
            // Do nothing for cancelled or completed orders
            break;
    }

    revalidateTag(GlobalConstants.ORDER, "max");
};

const pendingOrderToPaid = async (
    order: Prisma.OrderGetPayload<{
        include: {
            user: true;
            order_items: { include: { product: { include: { membership: true; ticket: true } } } };
        };
    }>,
    needsCapture: boolean,
): Promise<void> => {
    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.paid },
        include: {
            user: true,
            order_items: { include: { product: { include: { membership: true, ticket: true } } } },
        },
    });

    await paidOrderToShipped(updatedOrder, needsCapture);
};

const paidOrderToShipped = async (
    order: Prisma.OrderGetPayload<{
        include: {
            user: true;
            order_items: { include: { product: { include: { membership: true; ticket: true } } } };
        };
    }>,
    needsCapture: boolean,
): Promise<void> => {
    // This transaction may perform multiple updates and external work; increase timeout locally.
    const updatedOrder = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
            await processOrderItems(tx, order);
            return await tx.order.update({
                where: { id: order.id },
                data: { status: OrderStatus.shipped },
                select: {
                    id: true,
                    status: true,
                    total_amount: true,
                    payment_request_id: true,
                    payee_ref: true,
                    user: { select: { email: true } },
                    order_items: {
                        include: { product: { select: { name: true, description: true } } },
                    },
                },
            });
        },
        {
            // timeout in ms for this interactive transaction; set to 10s for safety
            timeout: 10000,
            // max wait to acquire a connection for transaction
            maxWait: 5000,
        },
    );
    try {
        await sendOrderConfirmation(updatedOrder);
    } catch (error) {
        // Allow progressing order despite failed confirmation
        console.error("Failed to send order confirmation:", error);
    }

    await shippedOrderToCompleted(updatedOrder, needsCapture);
};

const shippedOrderToCompleted = async (
    order: Prisma.OrderGetPayload<{
        select: {
            status: true;
            payee_ref: true;
            id: true;
            payment_request_id: true;
            total_amount: true;
        };
    }>,
    needsCapture: boolean,
) => {
    if (needsCapture) await capturePaymentFunds(order);
    await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.completed },
    });
};
