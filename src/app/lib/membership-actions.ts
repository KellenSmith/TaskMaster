"use server";

import { getLoggedInUser, getUserLanguage } from "./user-helpers";
import { getMembershipProduct } from "./user-membership-helpers";
import { createAndRedirectToOrder } from "./order-actions";
import { getOrganizationSettings } from "./organization-settings-helpers";
import { isMemberBlacklisted } from "./utils";
import { UserStatus } from "../../prisma/generated/enums";
import { prisma } from "../../prisma/prisma-client";
import LanguageTranslations from "./membership-language-translations";

/**
 * Creates an order for the user's membership and redirects to checkout.
 * @throws NEXT_REDIRECT on success - callers must use allowRedirectException.
 */
export const startMembershipRenewal = async (): Promise<string | undefined> => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error("User must be logged in to renew a membership");

    const language = await getUserLanguage();

    if (isMemberBlacklisted(loggedInUser)) {
        // Renewal would dead-end in renewUserMembership, so explain instead of
        // letting the user pay. Organizations can supply their own contact copy.
        const organizationSettings = await getOrganizationSettings();
        return (
            organizationSettings?.membership_ineligible_message ||
            LanguageTranslations.notEligible[language]
        );
    }
    if (loggedInUser.status !== UserStatus.validated)
        return LanguageTranslations.awaitingValidation[language];

    // Prefer renewing the product they already hold; fall back to the org default.
    let productId = loggedInUser.user_membership?.membership_id ?? null;
    if (productId) {
        const stillExists = await prisma.membership.findUnique({
            where: { product_id: productId },
            select: { product_id: true },
        });
        if (!stillExists) productId = null;
    }
    if (!productId) productId = (await getMembershipProduct()).id;

    // Throws NEXT_REDIRECT. Deliberately NOT wrapped in try/catch.
    await createAndRedirectToOrder([{ product_id: productId, quantity: 1 }]);
};
