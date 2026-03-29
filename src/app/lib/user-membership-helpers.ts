"use server";

import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { prisma } from "../../prisma/prisma-client";
import { isMembershipExpired } from "./utils";
import { revalidateTag } from "next/cache";
import { Prisma } from "../../prisma/generated/client";

export const renewUserMembership = async (
    tx: Prisma.TransactionClient,
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
    revalidateTag(GlobalConstants.USER, "max");
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
    // If no membership product exists, create a default
    const newMembershipProduct = await prisma.product.create({
        data: {
            name: GlobalConstants.MEMBERSHIP_PRODUCT_NAME,
            description: "Annual membership",
            price: 0,
            stock: null,
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
