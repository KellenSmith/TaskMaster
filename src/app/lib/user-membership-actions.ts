"use server";

import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { prisma } from "../../../prisma/prisma-client";
import { Prisma } from "@prisma/client";
import { createAndRedirectToOrder } from "./order-actions";
import { isMembershipExpired, isUserAdmin } from "./utils";
import { revalidateTag } from "next/cache";
import { AddMembershipSchema, UuidSchema } from "./zod-schemas";
import { SubscriptionToken } from "./payment-utils";
import { getLoggedInUser } from "./user-actions";

export const addUserMembership = async (userId: string, formData: FormData) => {
    const validatedData = AddMembershipSchema.parse(Object.fromEntries(formData.entries()));
    const membershipProduct = await getMembershipProduct();
    await prisma.userMembership.upsert({
        where: {
            user_id: userId,
            membership_id: membershipProduct.id,
        },
        create: {
            user: { connect: { id: userId } },
            membership: { connect: { product_id: membershipProduct.id } },
            expires_at: validatedData.expires_at,
        },
        update: { expires_at: validatedData.expires_at },
    });
    revalidateTag(GlobalConstants.USER);
};

export const renewUserMembership = async (
    tx: Prisma.TransactionClient,
    userId: string,
    orderId: string,
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

    let newExpiryDate = dayjs.utc().add(membership.duration, "d").toISOString();
    // If the membership is the same, extend the expiration date
    if (!isMembershipExpired(user) && userMembership?.membership_id === membershipId)
        newExpiryDate = dayjs
            .utc(userMembership.expires_at)
            .add(membership.duration, "d")
            .toISOString();

    const updatedUserMembership = await tx.userMembership.upsert({
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
    // Link the user membership to the order for reference
    await tx.order.update({
        where: { id: orderId },
        data: {
            UserMembership: { connect: { user_id: userId, membership_id: updatedUserMembership.membership_id } },
        }
    })
    revalidateTag(GlobalConstants.USER);
};

export const getUserMembershipSubscriptionOrder = async (userId: string) => {
    const orders = await prisma.order.findFirst({
        where: {
            user_id: userId,
            subscription_token: { not: null },
            order_items: {
                some: {
                    product: {
                        membership: { isNot: null },
                    },
                },
            },
        },
        orderBy: { created_at: "desc" },
        include: {
            order_items: {
                include: { product: { include: { membership: true } } },
            },
        },
    });
    return orders?.[0]
}

export const getUserMembershipSubscriptionToken = async (userId: string): Promise<SubscriptionToken | null> => {
    // Find the latest order (by created_at) that:
    // 1. Belongs to this user's membership (userMembershipUser_id)
    // 2. Has a non-null subscription_token
    // 3. Contains at least one order item whose product is a membership product
    const latestMembershipSubscriptionOrder = await getUserMembershipSubscriptionOrder(userId);
    const subscriptionToken = latestMembershipSubscriptionOrder?.subscription_token as SubscriptionToken;
    return subscriptionToken;
}

export const userHasActiveMembershipSubscription = async (
    userId: string,
): Promise<boolean> => {
    const subscriptionToken = await getUserMembershipSubscriptionToken(userId)
    if (!subscriptionToken) return false;
    // Check that the subscription has not expired
    const expiryDate = dayjs.utc(subscriptionToken.expiryDate, "MM/YYYY");
    return expiryDate.isValid() && expiryDate.isAfter(dayjs.utc());
};

export const cancelMembershipSubscription = async (userId: string) => {
    const validatedUserId = UuidSchema.parse(userId);

    const loggedInUser = await getLoggedInUser();
    // Only allow users to cancel their own subscription, unless they are an admin
    if (loggedInUser?.id !== validatedUserId && !isUserAdmin(loggedInUser)) {
        throw new Error("You do not have permission to cancel this subscription.");
    }

    const subscriptionOrder = await getUserMembershipSubscriptionOrder(userId);

    if (!subscriptionOrder?.subscription_token) {
        throw new Error("No active subscription found for this user.");
    }
    // const payload = {
    //     state: "Deleted",
    //     comment: "Cancelled membership subscription",
    // }
    // const deleteResponse = await fetch(`${process.env.SWEDBANK_BASE_URL}/psp/paymentorders/unscheduledTokens/${subscriptionToken.token}`, {
    //     method: "PATCH",
    //     headers: {
    //         "Content-Type": "application/json;version=3.1",
    //         Authorization: `Bearer ${process.env.SWEDBANK_PAY_ACCESS_TOKEN}`,
    //     },
    //     body: JSON.stringify(payload)
    // })
    // if (!deleteResponse.ok) throw new Error(`Swedbank Pay request failed: ${await deleteResponse.text()}`);


    // Remove the subscription token from the user's membership
    await prisma.order.update({
        where: { id: subscriptionOrder.id },
        data: { subscription_token: null },
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

    // Get or create the membership product
    const membershipProduct = await getMembershipProduct();

    const orderItems = [
        { product_id: membershipProduct.id, price: membershipProduct.price, quantity: 1 },
    ];

    await createAndRedirectToOrder(validatedUserId, orderItems);
};
