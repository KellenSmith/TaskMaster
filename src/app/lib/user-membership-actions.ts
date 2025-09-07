"use server";

import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { prisma } from "../../../prisma/prisma-client";
import { Prisma } from "@prisma/client";
import { createOrder } from "./order-actions";
import { isMembershipExpired } from "./utils";
import { revalidateTag } from "next/cache";
import z from "zod";
import { AddMembershipSchema, UuidSchema } from "./zod-schemas";

export const addUserMembership = async (userId: string, formData: FormData) => {
    const validatedData = AddMembershipSchema.parse(Object.fromEntries(formData.entries()));
    const membershipProduct = await getMembershipProduct();
    await prisma.userMembership.create({
        data: {
            user: { connect: { id: userId } },
            membership: { connect: { product_id: membershipProduct.id } },
            expires_at: validatedData.expires_at,
        },
    });
    revalidateTag(GlobalConstants.USER);
};

export const renewUserMembership = async (
    tx,
    userId: string,
    membershipId: string,
): Promise<void> => {
    const membership = await tx.membership.findUniqueOrThrow({
        where: { product_id: membershipId },
    });
    const userMembership = await tx.userMembership.findUnique({
        where: { user_id: userId },
    });
    const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { user_membership: true },
    });

    let newExpiryDate = dayjs().add(membership.duration, "d").toISOString();
    // If the membership is the same, extend the expiration date
    if (!isMembershipExpired(user) && userMembership?.membership_id === membershipId)
        newExpiryDate = dayjs(userMembership.expires_at)
            .add(membership.duration, "d")
            .toISOString();

    await tx.userMembership.upsert({
        where: { user_id: userId },
        update: {
            membership_id: membershipId,
            expires_at: newExpiryDate,
        },
        // If no membership exists, create a new one
        create: {
            user_id: userId,
            membership_id: membershipId,
            expires_at: newExpiryDate,
        },
    });
    revalidateTag(GlobalConstants.USER);
};

export const getMembershipProduct = async (): Promise<
    Prisma.ProductGetPayload<{ select: { id: true; price: true } }>
> => {
    // Try to find existing membership product
    const membershipProduct = await prisma.product.findFirst({
        where: { membership: { isNot: null } },
        select: {
            id: true,
            price: true,
        },
    });
    if (membershipProduct) {
        return membershipProduct;
    }
    // If no membership product exists, create it
    const newMembershipProduct = await prisma.product.create({
        data: {
            name: GlobalConstants.MEMBERSHIP_PRODUCT_NAME,
            description: "Annual membership",
            price: 0,
            unlimited_stock: true,

            membership: {
                create: {
                    duration: 365,
                },
            },
        },
        select: { id: true, price: true },
    });
    return newMembershipProduct;
};

export const createMembershipOrder = async (userId: string): Promise<void> => {
    const validatedUserId = UuidSchema.parse(userId);

    let orderItems: Prisma.OrderItemCreateManyOrderInput[];

    // Get or create the membership product
    const membershipProduct = await getMembershipProduct();

    orderItems = [
        { product_id: membershipProduct.id, price: membershipProduct.price, quantity: 1 },
    ];

    await createOrder(validatedUserId, orderItems);
};
