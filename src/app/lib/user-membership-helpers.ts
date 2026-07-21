import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { prisma, TransactionClient } from "../../prisma/prisma-client";
import { isMemberBlacklisted, isMembershipExpired } from "./utils";
import { revalidateTag } from "next/cache";
import { Prisma } from "../../prisma/generated/client";

export const renewUserMembership = async (
    tx: TransactionClient,
    userId: string,
    membershipId: string,
): Promise<void> => {
    const membership = await tx.membership.findUniqueOrThrow({
        where: { product_id: membershipId },
    });
    const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { user_membership: true, blacklist_entry: true },
    });
    if (isMemberBlacklisted(user)) {
        console.log(
            `The member ${user.nickname} - ${user.id} is blacklisted and their membership cannot be renewed.`,
        );
        throw new Error("Unauthorized");
    }

    let newExpiryDate = dayjs.utc().add(membership.duration, "d").toISOString();
    // If the membership is the same, extend the expiration date
    if (!isMembershipExpired(user) && user.user_membership?.membership_id === membershipId)
        newExpiryDate = dayjs
            .utc(user.user_membership.expires_at)
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
    Prisma.ProductGetPayload<{
        select: {
            id: true;
            price: true;
            membership: { select: { duration: true } };
        };
    }>
> => {
    // Try to find existing membership product
    const membershipProduct = await prisma.product.findFirst({
        where: { membership: { isNot: null } },
        select: {
            id: true,
            price: true,
            membership: { select: { duration: true } },
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
        select: { id: true, price: true, membership: { select: { duration: true } } },
    });
    return newMembershipProduct;
};
