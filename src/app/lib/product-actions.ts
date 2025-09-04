"use server";

import { Prisma, Product } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import {
    MembershipCreateSchema,
    MembershipWithoutProductSchema,
    ProductCreateSchema,
    ProductUpdateSchema,
} from "./zod-schemas";
import { renewUserMembership } from "./user-membership-actions";
import z from "zod";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { addEventParticipantWithTx } from "./event-participant-actions";
import { deleteOldBlob } from "./organization-settings-actions";

export const getAllNonTicketProducts = async (): Promise<Product[]> => {
    return await prisma.product.findMany({
        where: {
            ticket: null,
        },
    });
};

export const createProduct = async (
    parsedFieldValues: z.infer<typeof ProductCreateSchema>,
): Promise<void> => {
    await prisma.product.create({
        data: parsedFieldValues,
    });
    revalidateTag(GlobalConstants.PRODUCT);
};

export const createMembershipProduct = async (
    parsedFieldValues: z.infer<typeof MembershipCreateSchema>,
): Promise<void> => {
    const membershipValues = MembershipWithoutProductSchema.parse(parsedFieldValues);
    const productValues = ProductCreateSchema.parse(parsedFieldValues);
    await prisma.membership.create({
        data: {
            ...membershipValues,
            product: {
                create: productValues,
            },
        },
    });
    revalidateTag(GlobalConstants.PRODUCT);
    revalidateTag(GlobalConstants.MEMBERSHIP);
};

export const updateProduct = async (
    productId: string,
    parsedFieldValues: z.infer<typeof ProductUpdateSchema>,
): Promise<void> => {
    const oldProduct = await prisma.product.findUnique({ where: { id: productId } });

    await prisma.product.update({
        where: { id: productId },
        data: parsedFieldValues,
    });
    await deleteOldBlob(oldProduct.image_url, parsedFieldValues.image_url);
    revalidateTag(GlobalConstants.PRODUCT);
};

export const deleteProduct = async (productId: string): Promise<void> => {
    const deletedProduct = await prisma.product.delete({
        where: { id: productId },
        include: { membership: true, ticket: true },
    });
    await deleteOldBlob(deletedProduct.image_url);

    if (deletedProduct.membership) revalidateTag(GlobalConstants.MEMBERSHIP);
    if (deletedProduct.ticket) revalidateTag(GlobalConstants.TICKET);
    revalidateTag(GlobalConstants.PRODUCT);
};

export const processOrderedProduct = async (
    tx,
    userId: string,
    orderItem: Prisma.OrderItemGetPayload<{
        include: { product: { include: { membership: true; ticket: true } } };
    }>,
) => {
    if (!orderItem.product.unlimited_stock && orderItem.quantity > orderItem.product.stock)
        throw new Error(`Insufficient stock for: ${orderItem.product.name}`);
    for (let i = 0; i < orderItem.quantity; i++) {
        if (orderItem.product.membership) {
            await renewUserMembership(tx, userId, orderItem.product.membership.product_id);
        } else if (orderItem.product.ticket) {
            await addEventParticipantWithTx(tx, orderItem.product.ticket.product_id, userId);
        }
    }
};
