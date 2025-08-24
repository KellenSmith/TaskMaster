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
import { addEventParticipant } from "./event-participant-actions";

export const getAllProducts = async (): Promise<Product[]> => {
    try {
        return await prisma.product.findMany();
    } catch {
        throw new Error(`Failed fetching products`);
    }
};

export const createProduct = async (
    parsedFieldValues: z.infer<typeof ProductCreateSchema>,
): Promise<void> => {
    try {
        await prisma.product.create({
            data: parsedFieldValues,
        });
        revalidateTag(GlobalConstants.PRODUCT);
    } catch {
        throw new Error(`Failed creating product`);
    }
};

export const createMembershipProduct = async (
    parsedFieldValues: z.infer<typeof MembershipCreateSchema>,
): Promise<void> => {
    try {
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
    } catch {
        throw new Error("Failed to create membership");
    }
};

export const updateProduct = async (
    productId: string,
    parsedFieldValues: z.infer<typeof ProductUpdateSchema>,
): Promise<void> => {
    try {
        await prisma.product.update({
            where: { id: productId },
            data: parsedFieldValues,
        });
        revalidateTag(GlobalConstants.PRODUCT);
    } catch {
        throw new Error(`Failed updating product`);
    }
};

export const deleteProduct = async (productId: string): Promise<void> => {
    try {
        const membership = await prisma.membership.findUnique({
            where: { productId },
        });
        const ticket = await prisma.ticket.findUnique({
            where: { productId },
        });

        const deleteRelationsPromises = [];
        if (membership)
            deleteRelationsPromises.push(
                prisma.membership.delete({
                    where: { productId },
                }),
            );
        if (ticket)
            deleteRelationsPromises.push(
                prisma.ticket.delete({
                    where: { productId },
                }),
            );

        await prisma.$transaction([
            ...deleteRelationsPromises,
            prisma.product.delete({
                where: { id: productId },
            }),
        ]);
        revalidateTag(GlobalConstants.PRODUCT);
        revalidateTag(GlobalConstants.TICKET);
        revalidateTag(GlobalConstants.MEMBERSHIP);
    } catch {
        throw new Error(`Failed deleting product`);
    }
};

export const processOrderedProduct = async (
    userId: string,
    orderItem: Prisma.OrderItemGetPayload<{
        include: { product: { include: { membership: true; ticket: true } } };
    }>,
) => {
    const failedProducts: string[] = [];
    for (let i = 0; i < orderItem.quantity; i++) {
        if (orderItem.product.membership) {
            try {
                await renewUserMembership(userId, orderItem.product.membership.id);
            } catch {
                failedProducts.push(`Failed to renew membership for user ${userId}`);
            }
        } else if (orderItem.product.ticket) {
            // Add user as participant for the ticket
            try {
                await addEventParticipant(userId, orderItem.product.ticket.id);
                // Don't revalidate tag GlobalConstants.PARTICIPANT_USERS
                // This function is run during render where it's not allowed
            } catch (error) {
                failedProducts.push(
                    `Failed to create participant for user ${userId} in event ${orderItem.product.ticket.eventId}: ${error.message}`,
                );
            }
        }
    }
    if (failedProducts.length > 0) {
        throw new Error(failedProducts.join(", "));
    }
};
