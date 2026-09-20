import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Prisma } from "../../prisma/generated/client";
import { UserStatus } from "../../prisma/generated/enums";
import { isMemberBlacklisted, isMembershipExpired } from "./utils";

dayjs.extend(utc);

/**
 * Fallback reminder window used when an organization has not configured
 * `remind_membership_expires_in_days`. Shared with the cron job so the
 * "expiring soon" banner and the reminder email agree on the window.
 */
export const defaultRemindMembershipExpiresInDays = 7;

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

/**
 * The single source of truth for "what state is this user's membership in".
 * Pure and client-safe: no Prisma client, no server-only imports.
 */
export const getMembershipState = (
    user: MembershipUser,
    remindExpiresInDays?: number | null,
): MembershipStateType => {
    if (!user) return MembershipState.anonymous;
    // Checked before awaitingValidation: a blacklisted user must never be offered a
    // renewal CTA, since renewUserMembership throws Unauthorized for them.
    if (isMemberBlacklisted(user)) return MembershipState.blacklisted;
    if (user.status === UserStatus.pending) return MembershipState.awaitingValidation;
    // Discriminating on user_membership is what tells "never had one" from "lapsed".
    if (isMembershipExpired(user))
        return user.user_membership ? MembershipState.expired : MembershipState.awaitingPayment;

    const daysLeft = dayjs.utc(user.user_membership!.expires_at).diff(dayjs.utc(), "day");
    return daysLeft <= (remindExpiresInDays ?? defaultRemindMembershipExpiresInDays)
        ? MembershipState.expiringSoon
        : MembershipState.active;
};

export const getDaysUntilExpiry = (user: MembershipUser): number | null =>
    user?.user_membership
        ? dayjs.utc(user.user_membership.expires_at).diff(dayjs.utc(), "day")
        : null;
