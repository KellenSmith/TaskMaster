"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prisma-client";
import {
    MembershipWithoutProductSchema,
    ProductCreateSchema,
    ProductUpdateSchema,
    UuidSchema,
} from "./zod-schemas";
import { renewUserMembership } from "./user-membership-actions";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { addEventParticipantWithTx } from "./event-participant-actions";
import { deleteOldBlob } from "./organization-settings-actions";
import { sanitizeFormData } from "./html-sanitizer";
import { sendEmailNotification } from "./mail-service/mail-service";
import { getAbsoluteUrl } from "./utils";

export const getAllNonTicketProducts = async (): Promise<
    Prisma.ProductGetPayload<{ include: { membership: true } }>[]
> => {
    return await prisma.product.findMany({
        where: {
            ticket: null,
        },
        include: {
            membership: true,
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
    const formDataObject = Object.fromEntries(formData.entries());
    const membershipData = MembershipWithoutProductSchema.parse(formDataObject);
    const productValues = ProductUpdateSchema.parse(formDataObject);
    // Sanitize rich text fields (description)before saving to database
    const sanitizedProductData = sanitizeFormData(productValues);
    await prisma.membership.create({
        data: {
            ...membershipData,
            product: {
                create: sanitizedProductData,
            },
        },
    });
    revalidateTag(GlobalConstants.PRODUCT);
    revalidateTag(GlobalConstants.MEMBERSHIP);
};

export const updateMembershipProduct = async (
    productId: string,
    formData: FormData,
): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedProductId = UuidSchema.parse(productId);
    const formDataObject = Object.fromEntries(formData.entries());
    const membershipData = MembershipWithoutProductSchema.parse(formDataObject);
    const productValues = ProductUpdateSchema.parse(formDataObject);
    // Sanitize rich text fields (description)before saving to database
    const sanitizedProductData = sanitizeFormData(productValues);

    await prisma.membership.update({
        where: {
            product_id: validatedProductId,
        },
        data: {
            ...membershipData,
            product: {
                update: sanitizedProductData,
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
    tx: Prisma.TransactionClient,
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
        } else {
            const subject = `Product purchased: ${orderItem.product.name}`;
            const message = `User ID: ${userId}\nProduct: ${orderItem.product.name}\nQuantity: ${orderItem.quantity}`;
            await sendEmailNotification(process.env.EMAIL, subject, message, [
                {
                    buttonName: "View Order",
                    url: getAbsoluteUrl([GlobalConstants.ORDER], {
                        [GlobalConstants.ORDER_ID]: orderItem.order_id,
                    }),
                },
            ]); // TODO: replace with real fulfillment process
        }
    }
};
