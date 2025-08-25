"use server";

import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { prisma } from "../../../prisma/prisma-client";
import { Prisma } from "@prisma/client";
import { createOrder } from "./order-actions";
import { isMembershipExpired } from "./definitions";
import { getLoggedInUser } from "./user-actions";
import { encryptJWT } from "./auth";
import { revalidateTag } from "next/cache";

export const renewUserMembership = async (userId: string, membershipId: string): Promise<void> => {
    try {
        const membership = await prisma.membership.findUniqueOrThrow({
            where: { id: membershipId },
        });
        const userMembership = await prisma.userMembership.findUnique({
            where: { userId: userId },
        });

        let newExpiryDate = dayjs().add(membership.duration, "d").toISOString();
        const loggedInUser = await getLoggedInUser();
        // If the membership is the same, extend the expiration date
        if (!isMembershipExpired(loggedInUser) && userMembership?.membershipId === membershipId)
            newExpiryDate = dayjs(userMembership.expiresAt)
                .add(membership.duration, "d")
                .toISOString();

        await prisma.userMembership.upsert({
            where: { userId: userId },
            update: {
                membershipId: membershipId,
                expiresAt: newExpiryDate,
            },
            // If no membership exists, create a new one
            create: {
                userId: userId,
                membershipId: membershipId,
                expiresAt: newExpiryDate,
            },
        });

        // Make sure authorization and user context always uses the latest user data
        const updatedUser = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: { userMembership: true },
        });
        await encryptJWT(updatedUser);
        revalidateTag(GlobalConstants.USER);
    } catch (error) {
        console.error("Failed to renew user membership:", error);
        throw new Error("Failed to renew membership");
    }
};

export const getMembershipProduct = async (): Promise<
    Prisma.ProductGetPayload<{ select: { id: true; price: true } }>
> => {
    try {
        // Try to find existing membership product
        const membershipProduct = await prisma.product.findFirst({
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
                unlimitedStock: true,

                membership: {
                    create: {
                        duration: 365,
                    },
                },
            },
            select: { id: true, price: true },
        });
        return newMembershipProduct;
    } catch (error) {
        throw new Error(`Failed to get/create membership product: ${error.message}`);
    }
};

export const createMembershipOrder = async (): Promise<void> => {
    let orderItems: Prisma.OrderItemCreateManyOrderInput[];
    try {
        // Get or create the membership product
        const membershipProduct = await getMembershipProduct();

        orderItems = [
            { productId: membershipProduct.id, price: membershipProduct.price, quantity: 1 },
        ];
    } catch {
        throw new Error("Failed to create order for membership");
    }
    if (!orderItems || orderItems.length === 0) {
        throw new Error("Failed to create order for membership");
    }
    await createOrder(orderItems);
};
