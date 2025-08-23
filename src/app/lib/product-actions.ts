"use server";

import { Prisma, Product } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import {
    MembershipCreateSchema,
    ProductCreateSchema,
    ProductUpdateSchema,
    UserMembershipWithoutProductSchema,
} from "./zod-schemas";
import { renewUserMembership } from "./user-membership-actions";
import z from "zod";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";

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
        const membershipValues = UserMembershipWithoutProductSchema.parse(parsedFieldValues);
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

export const deleteProduct = async (product: Product): Promise<void> => {
    try {
        const membership = await prisma.membership.findUnique({
            where: { productId: product.id },
        });
        const ticket = await prisma.ticket.findUnique({
            where: { productId: product.id },
        });

        const deleteRelationsPromises = [];
        if (membership)
            deleteRelationsPromises.push(
                prisma.membership.delete({
                    where: { productId: product.id },
                }),
            );
        if (ticket)
            deleteRelationsPromises.push(
                prisma.ticket.delete({
                    where: { productId: product.id },
                }),
            );

        await prisma.$transaction([
            ...deleteRelationsPromises,
            prisma.product.delete({
                where: { id: product.id },
            }),
        ]);
        revalidateTag(GlobalConstants.PRODUCT);
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
                await prisma.participantInEvent.create({
                    data: {
                        userId,
                        eventId: orderItem.product.ticket.eventId,
                        ticketId: orderItem.product.ticket.id,
                    },
                });
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
