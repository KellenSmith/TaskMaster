"use server";

import { prisma } from "../../prisma/prisma-client";
import {
    MembershipWithoutProductSchema,
    ProductCreateSchema,
    ProductUpdateSchema,
    UuidSchema,
} from "./zod-schemas";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { deleteOldBlob } from "./organization-settings-actions";
import { sanitizeFormData } from "./html-sanitizer";

export const createProduct = async (formData: FormData): Promise<void> => {
    // Revalidate input with zod schema - don't trust the client
    const validatedData = ProductCreateSchema.parse(Object.fromEntries(formData.entries()));

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    await prisma.product.create({
        data: sanitizedData,
    });
    revalidateTag(GlobalConstants.PRODUCT, "max");
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
    revalidateTag(GlobalConstants.PRODUCT, "max");
    revalidateTag(GlobalConstants.MEMBERSHIP, "max");
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

    const oldProduct = await prisma.product.findUniqueOrThrow({
        where: { id: validatedProductId },
    });

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

    // Delete old blob if image_url was provided in the update and differs from the old one
    if ("image_url" in sanitizedProductData)
        await deleteOldBlob(oldProduct.image_url, sanitizedProductData.image_url);

    revalidateTag(GlobalConstants.PRODUCT, "max");
    revalidateTag(GlobalConstants.MEMBERSHIP, "max");
};

export const updateProduct = async (productId: string, formData: FormData): Promise<void> => {
    // Validate product ID format
    const validatedProductId = UuidSchema.parse(productId);
    // Revalidate input with zod schema - don't trust the client
    const validatedData = ProductUpdateSchema.parse(Object.fromEntries(formData.entries()));

    // Sanitize rich text fields before saving to database
    const sanitizedData = sanitizeFormData(validatedData);

    const oldProduct = await prisma.product.findUniqueOrThrow({
        where: { id: validatedProductId },
    });

    await prisma.product.update({
        where: { id: validatedProductId },
        data: sanitizedData,
    });

    // Delete old blob if image_url was provided in the update and differs from the old one
    if ("image_url" in sanitizedData)
        await deleteOldBlob(oldProduct.image_url, sanitizedData.image_url);

    revalidateTag(GlobalConstants.PRODUCT, "max");
};

export const deleteProduct = async (productId: string): Promise<void> => {
    // Validate product ID format
    const validatedProductId = UuidSchema.parse(productId);

    const deletedProduct = await prisma.product.delete({
        where: { id: validatedProductId },
        include: { membership: true, ticket: true },
    });
    await deleteOldBlob(deletedProduct.image_url);

    if (deletedProduct.membership) revalidateTag(GlobalConstants.MEMBERSHIP, "max");
    if (deletedProduct.ticket) revalidateTag(GlobalConstants.TICKET, "max");
    revalidateTag(GlobalConstants.PRODUCT, "max");
};
