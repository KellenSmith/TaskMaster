"use server";

import dayjs from "dayjs";
import { OrderStatus, Prisma } from "../../prisma/generated/client";
import { renewUserMembership } from "./user-membership-actions";
import { addEventParticipantWithTx } from "./event-participant-actions";
import { createElement } from "react";
import EmailNotificationTemplate from "./mail-service/mail-templates/MailNotificationTemplate";
import { getAbsoluteUrl } from "./utils";
import GlobalConstants from "../GlobalConstants";
import { sendMail } from "./mail-service/mail-service";

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

export const processOrderedProduct = async (
    tx: Prisma.TransactionClient,
    userId: string,
    orderItem: Prisma.OrderItemGetPayload<{
        include: { product: { include: { membership: true; ticket: true } } };
    }>,
) => {
    if (orderItem.product.stock !== null && orderItem.quantity > orderItem.product.stock)
        throw new Error(`Insufficient stock for: ${orderItem.product.name}`);
    for (let i = 0; i < orderItem.quantity; i++) {
        if (orderItem.product.membership) {
            await renewUserMembership(tx, userId, orderItem.product.membership.product_id);
        } else if (orderItem.product.ticket) {
            await addEventParticipantWithTx(tx, orderItem.product.ticket.product_id, userId);
        } else {
            // TODO: replace with real fulfillment process
            const mailContent = createElement(EmailNotificationTemplate, {
                message: `User ID: ${userId}\nProduct: ${orderItem.product.name}\nQuantity: ${orderItem.quantity}`,
                linkButtons: [
                    {
                        buttonName: "View Order",
                        url: getAbsoluteUrl([GlobalConstants.ORDER], {
                            [GlobalConstants.ORDER_ID]: orderItem.order_id,
                        }),
                    },
                ],
            });
            await sendMail(
                [process.env.EMAIL as string],
                `Product purchased: ${orderItem.product.name}`,
                mailContent,
            );
        }
    }
};
