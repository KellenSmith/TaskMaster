"use server";

import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { prisma } from "../../../prisma/prisma-client";
import { Language, Prisma } from "@prisma/client";
import { createAndRedirectToOrder } from "./order-actions";
import { getAbsoluteUrl, isMembershipExpired, isUserAdmin } from "./utils";
import { revalidateTag } from "next/cache";
import { AddMembershipSchema, UuidSchema } from "./zod-schemas";
import { PaymentOrderResponse } from "./payment-utils";
import { getLoggedInUser, getUserLanguage } from "./user-actions";
import { headers } from "next/headers";
import { generatePayeeReference, makeSwedbankApiRequest } from "./payment-actions";
import { getOrganizationSettings } from "./organization-settings-actions";

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

export const startMembershipSubscription = async (userId: string): Promise<void> => {
    const validatedUserId = UuidSchema.parse(userId);

    const loggedInUser = await getLoggedInUser();
    // Only allow users to start their own subscription, unless they are an admin
    if (loggedInUser?.id !== validatedUserId && !isUserAdmin(loggedInUser)) {
        throw new Error("You do not have permission to start this subscription.");
    }

    // Only allow starting a subscription if the user has a membership.
    // Otherwise subscription is started when paying for the membership.
    const userMembership = await prisma.userMembership.findUniqueOrThrow({
        where: { user_id: validatedUserId },
        include: { membership: { include: { product: true } } },
    });
    const userLanguage = await getUserLanguage();
    const organizationSettings = await getOrganizationSettings()
    const payeeRef = await generatePayeeReference(validatedUserId, "SUB");
    await prisma.userMembership.update({
        where: { user_id: validatedUserId },
        data: { payeeRef: payeeRef },
    });

    const paymentRequestPayload = {
        paymentorder: {
            operation: "Verify",
            currency: "SEK",
            generateUnscheduledToken: "true",
            description: "Subscription for membership",
            productName: userMembership.membership.product.name,
            userAgent: (await headers()).get("user-agent") || "Unknown",
            language: userLanguage === Language.swedish ? "sv-SE" : "en-US",
            urls: {
                hostUrls: [getAbsoluteUrl([GlobalConstants.HOME])],
                completeUrl: getAbsoluteUrl([GlobalConstants.PROFILE]),
                cancelUrl: getAbsoluteUrl([GlobalConstants.PROFILE]),
                callbackUrl: getAbsoluteUrl([GlobalConstants.PAYMENT_CALLBACK], {
                    [GlobalConstants.ORDER_ID]: "Subscription activation",
                }),
                logoUrl: organizationSettings?.logo_url || undefined,
                termsOfServiceUrl: organizationSettings?.terms_of_purchase_english_url || undefined,
            },
            payeeInfo: {
                payeeId: process.env.SWEDBANK_PAY_PAYEE_ID,
                payeeName: process.env.NEXT_PUBLIC_ORG_NAME,
                payeeReference: payeeRef,
            },
            // TODO: Include order items in the payment request for better tracking
        },
    }

    const verificationResponse = await makeSwedbankApiRequest(
        `${process.env.SWEDBANK_BASE_URL}/psp/paymentorders`,
        paymentRequestPayload,
    );
    if (!verificationResponse.ok)
        throw new Error(`Swedbank Pay request failed: ${await verificationResponse.text()}`);

    const responseData: PaymentOrderResponse = await verificationResponse.json();

    const redirectOperation = responseData.operations.find((op) => op.rel === "redirect-checkout");

    if (!redirectOperation || !redirectOperation.href) {
        throw new Error("Redirect URL not found in payment response");
    }
};

export const cancelMembershipSubscription = async (userId: string) => {
    const validatedUserId = UuidSchema.parse(userId);

    const loggedInUser = await getLoggedInUser();
    // Only allow users to cancel their own subscription, unless they are an admin
    if (loggedInUser?.id !== validatedUserId && !isUserAdmin(loggedInUser)) {
        throw new Error("You do not have permission to cancel this subscription.");
    }

    await prisma.userMembership.update({
        where: { user_id: validatedUserId },
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
