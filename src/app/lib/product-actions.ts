"use server";

import { Prisma, Product } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import {
    MembershipCreateSchema,
    MembershipWithoutProductSchema,
    ProductCreateSchema,
    ProductUpdateSchema,
    UuidSchema,
} from "./zod-schemas";
import { renewUserMembership } from "./user-membership-actions";
import z from "zod";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { addEventParticipantWithTx } from "./event-participant-actions";
import { deleteOldBlob } from "./organization-settings-actions";
import { sanitizeFormData } from "./html-sanitizer";

export const getAllNonTicketProducts = async (): Promise<Product[]> => {
    return await prisma.product.findMany({
        where: {
            ticket: null,
        },
    });
};

export const createProduct = async (formData: FormData): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = ProductCreateSchema.parse(Object.fromEntries(formData.entries()));

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    await prisma.product.create({
        data: sanitizedData,
    });
    revalidateTag(GlobalConstants.PRODUCT);
};

export const createMembershipProduct = async (formData: FormData): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = MembershipCreateSchema.parse(Object.fromEntries(formData.entries()));

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    const membershipValues = MembershipWithoutProductSchema.parse(sanitizedData);
    const productValues = ProductCreateSchema.parse(sanitizedData);
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

export const updateProduct = async (productId: string, formData: FormData): Promise<void> => {
    // Validate product ID format
    const validatedProductId = UuidSchema.parse(productId);
    // Revalidate input with zod schema - don't trust the client
    const validatedData = ProductUpdateSchema.parse(Object.fromEntries(formData.entries()));
    console.log(validatedData);

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    const oldProduct = await prisma.product.findUnique({ where: { id: validatedProductId } });

    await prisma.product.update({
        where: { id: validatedProductId },
        data: sanitizedData,
    });
    await deleteOldBlob(oldProduct.image_url, sanitizedData.image_url);
    revalidateTag(GlobalConstants.PRODUCT);
};

export const deleteProduct = async (productId: string): Promise<void> => {
    // Validate product ID format
    const validatedProductId = UuidSchema.parse(productId);

    const deletedProduct = await prisma.product.delete({
        where: { id: validatedProductId },
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
