import dayjs from "dayjs";
import { Prisma } from "../../prisma/generated/browser";
import { UserStatus } from "../../prisma/generated/enums";
import { isMemberBlacklisted, isMembershipExpired } from "./utils";

/**
 * Default number of days before expiry at which a membership counts as "expiring soon".
 * Used when OrganizationSettings.remind_membership_expires_in_days is not set.
 * Shared with the expiry-reminder cron so the two never disagree.
 */
export const DEFAULT_REMIND_MEMBERSHIP_EXPIRES_IN_DAYS = 7;

export const MembershipState = {
    anonymous: "anonymous",
    blacklisted: "blacklisted",
    awaitingValidation: "awaitingValidation", // applied, admin has not approved
    awaitingPayment: "awaitingPayment", // approved, never held a membership
    expired: "expired", // held one, it lapsed
    expiringSoon: "expiringSoon", // active, inside the reminder window
    active: "active",
} as const;

export type MembershipStateType = (typeof MembershipState)[keyof typeof MembershipState];

export type MembershipUser = Prisma.UserGetPayload<{
    select: { status: true; user_membership: true; blacklist_entry: true };
}> | null;

export const getDaysUntilExpiry = (user: MembershipUser): number | null =>
    user?.user_membership
        ? dayjs.utc(user.user_membership.expires_at).diff(dayjs.utc(), "day")
        : null;

export const getMembershipState = (
    user: MembershipUser,
    remindExpiresInDays: number | null | undefined,
): MembershipStateType => {
    if (!user) return MembershipState.anonymous;
    if (isMemberBlacklisted(user)) return MembershipState.blacklisted;
    if (user.status === UserStatus.pending) return MembershipState.awaitingValidation;
    if (isMembershipExpired(user))
        return user.user_membership ? MembershipState.expired : MembershipState.awaitingPayment;

    const daysLeft = getDaysUntilExpiry(user) ?? 0;
    return daysLeft <= (remindExpiresInDays ?? DEFAULT_REMIND_MEMBERSHIP_EXPIRES_IN_DAYS)
        ? MembershipState.expiringSoon
        : MembershipState.active;
};
