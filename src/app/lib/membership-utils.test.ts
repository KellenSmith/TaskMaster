import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import { UserStatus } from "../../prisma/generated/enums";
import {
    DEFAULT_REMIND_MEMBERSHIP_EXPIRES_IN_DAYS,
    getDaysUntilExpiry,
    getMembershipState,
    MembershipState,
    MembershipUser,
} from "./membership-utils";

type NonNullUser = NonNullable<MembershipUser>;

const makeUser = (overrides: Partial<NonNullUser> = {}): NonNullUser => ({
    status: UserStatus.validated,
    user_membership: null,
    blacklist_entry: null,
    ...overrides,
});

const membershipExpiringIn = (days: number): NonNullUser["user_membership"] => ({
    user_id: "user-1",
    membership_id: "product-1",
    expires_at: dayjs.utc().add(days, "day").add(1, "hour").toDate(),
});

const blacklistEntry = (expires_at: Date | null): NonNullUser["blacklist_entry"] => ({
    user_id: "user-1",
    created_by_id: null,
    created_at: new Date(),
    expires_at,
    reason: "test",
});

describe("getMembershipState", () => {
    it("returns anonymous for null user", () => {
        expect(getMembershipState(null, 7)).toBe(MembershipState.anonymous);
    });

    it("returns blacklisted even when the membership is unexpired", () => {
        const user = makeUser({
            user_membership: membershipExpiringIn(100),
            blacklist_entry: blacklistEntry(null),
        });
        expect(getMembershipState(user, 7)).toBe(MembershipState.blacklisted);
    });

    it("returns blacklisted before awaitingValidation", () => {
        const user = makeUser({
            status: UserStatus.pending,
            blacklist_entry: blacklistEntry(dayjs.utc().add(1, "day").toDate()),
        });
        expect(getMembershipState(user, 7)).toBe(MembershipState.blacklisted);
    });

    it("ignores an expired blacklist entry", () => {
        const user = makeUser({
            user_membership: membershipExpiringIn(100),
            blacklist_entry: blacklistEntry(dayjs.utc().subtract(1, "day").toDate()),
        });
        expect(getMembershipState(user, 7)).toBe(MembershipState.active);
    });

    it("returns awaitingValidation for pending users, even with a membership", () => {
        const user = makeUser({
            status: UserStatus.pending,
            user_membership: membershipExpiringIn(100),
        });
        expect(getMembershipState(user, 7)).toBe(MembershipState.awaitingValidation);
    });

    it("returns awaitingPayment for validated users who never held a membership", () => {
        expect(getMembershipState(makeUser(), 7)).toBe(MembershipState.awaitingPayment);
    });

    it("returns expired for a lapsed membership", () => {
        const user = makeUser({ user_membership: membershipExpiringIn(-3) });
        expect(getMembershipState(user, 7)).toBe(MembershipState.expired);
    });

    it("returns expired when expiry is just in the past", () => {
        const user = makeUser({
            user_membership: {
                user_id: "user-1",
                membership_id: "product-1",
                expires_at: dayjs.utc().subtract(1, "second").toDate(),
            },
        });
        expect(getMembershipState(user, 7)).toBe(MembershipState.expired);
    });

    it("returns expiringSoon inside the reminder window", () => {
        const user = makeUser({ user_membership: membershipExpiringIn(3) });
        expect(getMembershipState(user, 7)).toBe(MembershipState.expiringSoon);
    });

    it("treats daysLeft === remindDays as expiringSoon (inclusive)", () => {
        const user = makeUser({ user_membership: membershipExpiringIn(7) });
        expect(getDaysUntilExpiry(user)).toBe(7);
        expect(getMembershipState(user, 7)).toBe(MembershipState.expiringSoon);
    });

    it("returns active outside the reminder window", () => {
        const user = makeUser({ user_membership: membershipExpiringIn(8) });
        expect(getMembershipState(user, 7)).toBe(MembershipState.active);
    });

    it("honours a custom reminder window", () => {
        const user = makeUser({ user_membership: membershipExpiringIn(20) });
        expect(getMembershipState(user, 30)).toBe(MembershipState.expiringSoon);
        expect(getMembershipState(user, 10)).toBe(MembershipState.active);
    });

    it("falls back to the default reminder window when unset", () => {
        const inside = makeUser({
            user_membership: membershipExpiringIn(DEFAULT_REMIND_MEMBERSHIP_EXPIRES_IN_DAYS),
        });
        const outside = makeUser({
            user_membership: membershipExpiringIn(DEFAULT_REMIND_MEMBERSHIP_EXPIRES_IN_DAYS + 1),
        });
        expect(getMembershipState(inside, null)).toBe(MembershipState.expiringSoon);
        expect(getMembershipState(outside, undefined)).toBe(MembershipState.active);
    });
});

describe("getDaysUntilExpiry", () => {
    it("returns null for null user or no membership", () => {
        expect(getDaysUntilExpiry(null)).toBeNull();
        expect(getDaysUntilExpiry(makeUser())).toBeNull();
    });

    it("returns whole days until expiry", () => {
        expect(getDaysUntilExpiry(makeUser({ user_membership: membershipExpiringIn(5) }))).toBe(5);
    });

    it("returns a negative number for lapsed memberships", () => {
        const user = makeUser({ user_membership: membershipExpiringIn(-3) });
        expect(getDaysUntilExpiry(user)).toBeLessThan(0);
    });
});
