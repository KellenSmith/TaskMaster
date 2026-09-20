"use server";

import { getLoggedInUser, getUserLanguage } from "./user-helpers";
import { getMembershipProduct } from "./user-membership-helpers";
import { createAndRedirectToOrder } from "./order-actions";
import { isMemberBlacklisted } from "./utils";
import { UuidSchema } from "./zod-schemas";
import { UserStatus } from "../../prisma/generated/enums";
import { prisma } from "../../prisma/prisma-client";
import LanguageTranslations from "./membership-language-translations";

const membershipProductExists = async (productId: string): Promise<boolean> =>
    !!(await prisma.membership.findUnique({
        where: { product_id: productId },
        select: { product_id: true },
    }));

/**
 * Creates an order for a membership product and redirects the user to checkout.
 *
 * Resolves the product in this order:
 * 1. `productId`, when it is a valid uuid of an existing membership product
 * 2. the membership product the user already holds, when it still exists
 * 3. the organization's single membership product
 *
 * When more than one membership product exists and neither 1 nor 2 applies,
 * the user must choose a product and a localized error is returned instead.
 *
 * @throws NEXT_REDIRECT on success - client callers must use `allowRedirectException`.
 * @returns a localized error message on expected failure, otherwise never returns.
 */
export const startMembershipRenewal = async (productId?: string): Promise<string | undefined> => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error("User must be logged in to renew a membership");

    const language = await getUserLanguage();

    if (isMemberBlacklisted(loggedInUser)) return LanguageTranslations.notEligible[language];
    if (loggedInUser.status !== UserStatus.validated)
        return LanguageTranslations.awaitingValidation[language];

    let resolvedProductId: string | null = null;

    const requestedProductId = UuidSchema.safeParse(productId);
    if (requestedProductId.success && (await membershipProductExists(requestedProductId.data)))
        resolvedProductId = requestedProductId.data;

    const currentProductId = loggedInUser.user_membership?.membership_id;
    if (!resolvedProductId && currentProductId && (await membershipProductExists(currentProductId)))
        resolvedProductId = currentProductId;

    if (!resolvedProductId) {
        // One click is only unambiguous when the organization has a single membership product
        if ((await prisma.membership.count()) > 1)
            return LanguageTranslations.membershipChoiceRequired[language];
        resolvedProductId = (await getMembershipProduct()).id;
    }

    // Throws NEXT_REDIRECT on success. Deliberately not wrapped in try/catch.
    await createAndRedirectToOrder([{ product_id: resolvedProductId, quantity: 1 }]);
};
