import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import { UserStatus } from "../../prisma/generated/enums";
import {
    defaultRemindMembershipExpiresInDays,
    getDaysUntilExpiry,
    getMembershipState,
    MembershipState,
    MembershipUser,
} from "./membership-utils";

const buildUser = (overrides: Partial<NonNullable<MembershipUser>> = {}): MembershipUser =>
    ({
        status: UserStatus.validated,
        user_membership: null,
        blacklist_entry: null,
        ...overrides,
    }) as NonNullable<MembershipUser>;

const membershipExpiring = (fromNow: number, unit: dayjs.ManipulateType = "day") => ({
    expires_at: dayjs.utc().add(fromNow, unit).toDate(),
});

describe("getMembershipState", () => {
    it("returns anonymous when there is no user", () => {
        expect(getMembershipState(null, 7)).toBe(MembershipState.anonymous);
    });

    it("returns blacklisted for a blacklisted user", () => {
        const user = buildUser({
            blacklist_entry: { expires_at: null } as any,
            user_membership: membershipExpiring(1, "year") as any,
        });
        expect(getMembershipState(user, 7)).toBe(MembershipState.blacklisted);
    });

    it("prefers blacklisted over awaitingValidation, so no dead-end CTA is offered", () => {
        const user = buildUser({
            status: UserStatus.pending,
            blacklist_entry: { expires_at: null } as any,
        });
        expect(getMembershipState(user, 7)).toBe(MembershipState.blacklisted);
    });

    it("returns awaitingValidation for a pending user that already holds a membership", () => {
        const user = buildUser({
            status: UserStatus.pending,
            user_membership: membershipExpiring(1, "year") as any,
        });
        expect(getMembershipState(user, 7)).toBe(MembershipState.awaitingValidation);
    });

    it("returns awaitingPayment when the user never held a membership", () => {
        expect(getMembershipState(buildUser(), 7)).toBe(MembershipState.awaitingPayment);
    });

    it("returns expired when a held membership has lapsed", () => {
        const user = buildUser({ user_membership: membershipExpiring(-1, "day") as any });
        expect(getMembershipState(user, 7)).toBe(MembershipState.expired);
    });

    it("returns expiringSoon inside the reminder window", () => {
        const user = buildUser({ user_membership: membershipExpiring(3, "day") as any });
        expect(getMembershipState(user, 7)).toBe(MembershipState.expiringSoon);
    });

    it("treats daysLeft exactly equal to the reminder window as expiringSoon", () => {
        const user = buildUser({
            // A hair over 7 days so the truncating diff lands exactly on 7.
            user_membership: membershipExpiring(7 * 24 + 1, "hour") as any,
        });
        expect(getMembershipState(user, 7)).toBe(MembershipState.expiringSoon);
    });

    it("returns active outside the reminder window", () => {
        const user = buildUser({ user_membership: membershipExpiring(30, "day") as any });
        expect(getMembershipState(user, 7)).toBe(MembershipState.active);
    });

    it("treats an expiry of exactly now as expiringSoon, not expired", () => {
        const user = buildUser({ user_membership: { expires_at: dayjs.utc().toDate() } as any });
        expect(getMembershipState(user, 7)).toBe(MembershipState.expiringSoon);
    });

    it("falls back to the shared default reminder window", () => {
        const insideDefault = buildUser({
            user_membership: membershipExpiring(defaultRemindMembershipExpiresInDays - 1) as any,
        });
        const outsideDefault = buildUser({
            user_membership: membershipExpiring(defaultRemindMembershipExpiresInDays + 2) as any,
        });
        expect(getMembershipState(insideDefault, null)).toBe(MembershipState.expiringSoon);
        expect(getMembershipState(outsideDefault, undefined)).toBe(MembershipState.active);
    });
});

describe("getDaysUntilExpiry", () => {
    it("returns null without a user or a membership", () => {
        expect(getDaysUntilExpiry(null)).toBeNull();
        expect(getDaysUntilExpiry(buildUser())).toBeNull();
    });

    it("counts whole days left, and goes negative once lapsed", () => {
        const active = buildUser({
            user_membership: membershipExpiring(10 * 24 + 1, "hour") as any,
        });
        const lapsed = buildUser({
            user_membership: membershipExpiring(-3 * 24 - 1, "hour") as any,
        });
        expect(getDaysUntilExpiry(active)).toBe(10);
        expect(getDaysUntilExpiry(lapsed)).toBe(-3);
    });
});
