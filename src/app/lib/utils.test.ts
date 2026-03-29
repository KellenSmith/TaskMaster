import { describe, expect, it, vi } from "vitest";
import dayjs from "dayjs";
import {
    clientRedirect,
    getAbsoluteUrl,
    getRelativeUrl,
    isMembershipExpired,
    isUserAdmin,
    isUserHost,
    serverRedirect,
} from "./utils";
import { redirect } from "next/navigation";
import testdata from "../../test/testdata";
import { UserRole } from "../../prisma/generated/enums";

vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
}));

describe("utils", () => {
    describe("getRelativeUrl", () => {
        it("builds relative urls with normalized paths and search params", () => {
            const result = getRelativeUrl(["", "tasks", "", "123"], { q: "test", page: "2" });
            expect(result).toBe("/tasks/123?q=test&page=2");
        });

        it("builds relative urls without search params", () => {
            const result = getRelativeUrl(["", "profile"]);
            expect(result).toBe("/profile");
        });
    });

    describe("getAbsoluteUrl", () => {
        it("builds absolute urls using VERCEL_PROJECT_PRODUCTION_URL", () => {
            const result = getAbsoluteUrl(["calendar"], { view: "month" });
            expect(result).toBe(
                `https://${testdata.env.VERCEL_PROJECT_PRODUCTION_URL}/calendar?view=month`,
            );
        });

        it("builds absolute urls using window origin when VERCEL_PROJECT_PRODUCTION_URL is not set", () => {
            process.env.VERCEL_PROJECT_PRODUCTION_URL = undefined;

            const result = getAbsoluteUrl(["shop"]);

            expect(result).toBe(`${window.location.origin}/shop`);
        });

        it("throws when base url and window are missing", () => {
            process.env.VERCEL_PROJECT_PRODUCTION_URL = undefined;
            vi.stubGlobal("window", undefined as unknown as Window);

            expect(() => getAbsoluteUrl(["tasks"])).toThrow("Base URL not found");

            vi.unstubAllGlobals();
        });
    });

    describe("serverRedirect", () => {
        it("redirects on server using relative url", () => {
            serverRedirect(["orders", "123"], { status: "paid" });

            expect(redirect).toHaveBeenCalledWith("/orders/123?status=paid");
        });
    });

    describe("clientRedirect", () => {
        it("redirects on client using router push", () => {
            const router = { push: vi.fn() };

            clientRedirect(router as any, ["profile"], { tab: "settings" });

            expect(router.push).toHaveBeenCalledWith("/profile?tab=settings");
        });
    });

    describe("isMembershipExpired", () => {
        it("detects membership expiry", () => {
            expect(isMembershipExpired(null)).toBe(true);

            const noMembership = { user_membership: null } as any;
            expect(isMembershipExpired(noMembership)).toBe(true);

            const expired = {
                user_membership: { expires_at: dayjs().subtract(1, "day").toDate() },
            } as any;
            expect(isMembershipExpired(expired)).toBe(true);

            const valid = {
                user_membership: { expires_at: dayjs().add(1, "day").toDate() },
            } as any;
            expect(isMembershipExpired(valid)).toBe(false);
        });
    });

    describe("isUserAdmin", () => {
        it("identifies admins with valid membership", () => {
            const admin = {
                role: UserRole.admin,
                user_membership: { expires_at: dayjs().add(1, "day").toDate() },
            } as any;
            const member = {
                role: UserRole.member,
                user_membership: { expires_at: dayjs().add(1, "day").toDate() },
            } as any;
            const expiredAdmin = {
                role: UserRole.admin,
                user_membership: { expires_at: dayjs().subtract(1, "day").toDate() },
            } as any;

            expect(isUserAdmin(admin)).toBe(true);
            expect(isUserAdmin(member)).toBe(false);
            expect(isUserAdmin(expiredAdmin)).toBe(false);
            expect(isUserAdmin(null)).toBe(false);
        });
    });

    describe("isUserHost", () => {
        it("identifies event hosts", () => {
            const user = { id: "user-1" } as any;
            const event = { host_id: "user-1" } as any;
            const otherEvent = { host_id: "user-2" } as any;

            expect(isUserHost(user, event)).toBe(true);
            expect(isUserHost(user, otherEvent)).toBe(false);
            expect(isUserHost(null, event)).toBe(false);
            expect(isUserHost(user, null)).toBe(false);
        });
    });
});
