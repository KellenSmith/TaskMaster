import { Language, Prisma } from "@prisma/client";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import Error from "next/error";

// Ensure all date formatting uses UTC to avoid environment-specific timezone shifts
dayjs.extend(utc);

export const formatDate = (date: string | Date | Dayjs): string =>
    dayjs.utc(date).format("YYYY/MM/DD HH:mm");
export const formatPrice = (price: number): number => price / 100;

export const openResourceInNewTab = (resourceUrl: string) => {
    const newWindow = window.open(resourceUrl, "_blank", "noopener,noreferrer");
    // Prevent reverse tabnabbing
    if (newWindow) newWindow.opener = null;
};

export const allowRedirectException = (error: Error & { digest?: string }) => {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
        throw error;
    }
};

export const getPrivacyPolicyUrl = (
    organizationSettings: Prisma.OrganizationSettingsGetPayload<true>,
    language: Language,
) => {
    if (language === Language.english) return organizationSettings.privacy_policy_english_url;
    if (language === Language.swedish) return organizationSettings.privacy_policy_swedish_url;
};

export const getTermsOfMembershipUrl = (
    organizationSettings: Prisma.OrganizationSettingsGetPayload<true>,
    language: Language,
) => {
    if (language === Language.english) return organizationSettings.terms_of_membership_english_url;
    if (language === Language.swedish) return organizationSettings.terms_of_membership_swedish_url;
};

export const getTermsOfPurchaseUrl = (
    organizationSettings: Prisma.OrganizationSettingsGetPayload<true>,
    language: Language,
) => {
    if (language === Language.english) return organizationSettings.terms_of_purchase_english_url;
    if (language === Language.swedish) return organizationSettings.terms_of_purchase_swedish_url;
};

export const userHasSkillBadge = (
    user: Prisma.UserGetPayload<{
        select: { skill_badges: true };
    }>,
    skillBadgeId: string,
): boolean => {
    return user.skill_badges.some((userBadge) => userBadge.skill_badge_id === skillBadgeId);
};

/* export const userHasActiveMembershipSubscription = (
    user: Prisma.UserGetPayload<{
        select: { user_membership: true };
    }>,
) => {
    const subscriptionToken = user.user_membership?.subscription_token as SubscriptionToken;
    const expiryDate = dayjs.utc(subscriptionToken?.expiryDate, "MM/YYYY");
    return expiryDate.isValid() && expiryDate.isAfter(dayjs.utc());
}; */

export const isUserQualifiedForTask = (
    user: Prisma.UserGetPayload<{
        select: { skill_badges: true };
    }>,
    requiredTaskSkillBadges: Prisma.TaskSkillBadgeGetPayload<true>[],
) =>
    requiredTaskSkillBadges.every((taskSkillBadge) =>
        userHasSkillBadge(user, taskSkillBadge.skill_badge_id),
    );

export interface MailResult {
    accepted: number;
    rejected: number;
    fallbackJobId?: string; // Set when rate limiting triggers fallback
}
