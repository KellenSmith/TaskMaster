import { describe, expect, it } from "vitest";
import { Prisma, UserRole, UserStatus } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";
import testdata from "../../../test/testdata";
import { isUserAuthorized, routeTreeConfig, userHasRolePrivileges } from "./auth-utils";

type AuthUser = Prisma.UserGetPayload<{
    select: { role: true; status: true; user_membership: true };
}>;

const makeUser = (overrides: Partial<AuthUser> = {}): AuthUser =>
    ({
        role: UserRole.member,
        status: UserStatus.pending,
        user_membership: testdata.user.user_membership,
        ...overrides,
    }) as AuthUser;

describe("userHasRolePrivileges", () => {
    it("returns true when no role is required", () => {
        expect(userHasRolePrivileges(undefined, null)).toBe(true);
        expect(userHasRolePrivileges(undefined, undefined)).toBe(true);
    });

    it("returns false when user is missing and a role is required", () => {
        expect(userHasRolePrivileges(null, UserRole.member)).toBe(false);
        expect(userHasRolePrivileges(undefined, UserRole.admin)).toBe(false);
    });

    it("allows equal role", () => {
        const user = makeUser({ role: UserRole.member });
        expect(userHasRolePrivileges(user, UserRole.member)).toBe(true);
    });

    it("allows higher role", () => {
        const admin = makeUser({ role: UserRole.admin });
        expect(userHasRolePrivileges(admin, UserRole.member)).toBe(true);
    });

    it("denies lower role", () => {
        const member = makeUser({ role: UserRole.member });
        expect(userHasRolePrivileges(member, UserRole.admin)).toBe(false);
    });
});

describe("isUserAuthorized", () => {
    it("returns true when route config is missing and path ends", () => {
        const user = makeUser();
        expect(isUserAuthorized(user, [], undefined)).toBe(true);
    });

    it("allows public routes for unauthenticated users", () => {
        expect(
            isUserAuthorized(null, ["", GlobalConstants.LOGIN], routeTreeConfig),
        ).toBe(true);
        expect(
            isUserAuthorized(undefined, ["", GlobalConstants.APPLY], routeTreeConfig),
        ).toBe(true);
    });

    it("denies restricted routes for unauthenticated users", () => {
        expect(
            isUserAuthorized(null, ["", GlobalConstants.PROFILE], routeTreeConfig),
        ).toBe(false);
    });

    it("allows members with membership for membership-required routes", () => {
        const member = makeUser({ status: UserStatus.validated });
        expect(
            isUserAuthorized(member, ["", GlobalConstants.TASK], routeTreeConfig),
        ).toBe(true);
    });

    it("denies members without membership for membership-required routes", () => {
        const memberWithoutMembership = makeUser({
            status: UserStatus.validated,
            user_membership: null,
        });
        expect(
            isUserAuthorized(
                memberWithoutMembership,
                ["", GlobalConstants.TASK],
                routeTreeConfig,
            ),
        ).toBe(false);
    });

    it("allows routes that do not require membership", () => {
        const memberWithoutMembership = makeUser({
            status: UserStatus.validated,
            user_membership: null,
        });
        expect(
            isUserAuthorized(
                memberWithoutMembership,
                ["", GlobalConstants.SHOP],
                routeTreeConfig,
            ),
        ).toBe(true);
    });

    it("denies member access to admin routes", () => {
        const member = makeUser({ status: UserStatus.validated, role: UserRole.member });
        expect(
            isUserAuthorized(member, ["", GlobalConstants.MEMBERS], routeTreeConfig),
        ).toBe(false);
    });

    it("allows admin access to admin routes", () => {
        const admin = makeUser({ status: UserStatus.validated, role: UserRole.admin });
        expect(
            isUserAuthorized(admin, ["", GlobalConstants.MEMBERS], routeTreeConfig),
        ).toBe(true);
    });

    it("allows higher status to access lower-status routes", () => {
        const validatedMember = makeUser({ status: UserStatus.validated });
        expect(
            isUserAuthorized(
                validatedMember,
                ["", GlobalConstants.PROFILE],
                routeTreeConfig,
            ),
        ).toBe(true);
    });

    it("throws when route configuration is missing for a path", () => {
        const user = makeUser();
        expect(() =>
            isUserAuthorized(user, ["", "missing"], routeTreeConfig),
        ).toThrowError(/Route configuration/);
    });
});
