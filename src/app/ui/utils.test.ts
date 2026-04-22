import dayjs, { Dayjs } from "../lib/dayjs";
import { describe, expect, it, vi } from "vitest";
import { Language } from "../../prisma/generated/enums";
import {
    allowRedirectException,
    formatDate,
    formatPrice,
    getPrivacyPolicyUrl,
    getTermsOfMembershipUrl,
    getTermsOfPurchaseUrl,
    isUserQualifiedForTask,
    openResourceInNewTab,
    userHasSkillBadge,
} from "./utils";

const makeOrganizationSettings = (overrides: Record<string, unknown> = {}) =>
    ({
        privacy_policy_english_url: null,
        privacy_policy_swedish_url: null,
        terms_of_membership_english_url: null,
        terms_of_membership_swedish_url: null,
        terms_of_purchase_english_url: null,
        terms_of_purchase_swedish_url: null,
        ...overrides,
    }) as any;

describe("ui/utils", () => {
    describe("formatDate", () => {
        it("formats ISO date strings in UTC+2", () => {
            expect(formatDate("2026-02-03T10:30:00")).toBe("2026/02/03 10:30");
        });

        it("formats Date objects in UTC+2", () => {
            const date = dayjs("2026-04-05T06:07:00").toDate();

            expect(formatDate(date)).toBe("2026/04/05 06:07");
        });

        it("formats Dayjs objects in UTC+2", () => {
            const date = dayjs("2026-09-10T11:12:00");

            expect(formatDate(date)).toBe("2026/09/10 11:12");
        });
    });

    describe("formatPrice", () => {
        it("converts cents to major currency units", () => {
            expect(formatPrice(12345)).toBe(123.45);
            expect(formatPrice(0)).toBe(0);
        });
    });

    describe("openResourceInNewTab", () => {
        it("opens resource with safe window features and nulls opener", () => {
            const openedWindow = { opener: { existing: true } } as unknown as Window;
            const openSpy = vi.spyOn(window, "open").mockReturnValue(openedWindow);

            openResourceInNewTab("https://example.com/resource.pdf");

            expect(openSpy).toHaveBeenCalledWith(
                "https://example.com/resource.pdf",
                "_blank",
                "noopener,noreferrer",
            );
            expect(openedWindow.opener).toBeNull();
        });

        it("does not throw when window.open returns null", () => {
            vi.spyOn(window, "open").mockReturnValue(null);

            expect(() => openResourceInNewTab("https://example.com")).not.toThrow();
        });
    });

    describe("allowRedirectException", () => {
        it("rethrows Next.js redirect exceptions", () => {
            const redirectError = { digest: "NEXT_REDIRECT;replace;/dashboard" };

            try {
                allowRedirectException(redirectError);
                throw new Error("Expected allowRedirectException to throw");
            } catch (error) {
                expect(error).toBe(redirectError);
            }
        });

        it("does not throw for non-redirect errors", () => {
            expect(() => allowRedirectException(new Error("regular error"))).not.toThrow();
            expect(() => allowRedirectException({ digest: "SOME_OTHER_DIGEST" })).not.toThrow();
            expect(() => allowRedirectException(null)).not.toThrow();
            expect(() => allowRedirectException("NEXT_REDIRECT")).not.toThrow();
        });
    });

    describe("policy and terms URL helpers", () => {
        it("returns organization-specific privacy policy URLs when present", () => {
            const settings = makeOrganizationSettings({
                privacy_policy_english_url: "https://example.com/privacy-en.pdf",
                privacy_policy_swedish_url: "https://example.com/privacy-sv.pdf",
            });

            expect(getPrivacyPolicyUrl(settings, Language.english)).toBe(
                "https://example.com/privacy-en.pdf",
            );
            expect(getPrivacyPolicyUrl(settings, Language.swedish)).toBe(
                "https://example.com/privacy-sv.pdf",
            );
        });

        it("falls back to bundled privacy policy documents", () => {
            const settings = makeOrganizationSettings();

            expect(getPrivacyPolicyUrl(settings, Language.english)).toBe(
                "documents/privacy-policy-english.pdf",
            );
            expect(getPrivacyPolicyUrl(settings, Language.swedish)).toBe(
                "documents/privacy-policy-swedish.pdf",
            );
        });

        it("returns undefined for unsupported language in privacy policy helper", () => {
            const settings = makeOrganizationSettings();

            expect(getPrivacyPolicyUrl(settings, "other" as Language)).toBeUndefined();
        });

        it("returns terms of membership URL or null fallback", () => {
            const settings = makeOrganizationSettings({
                terms_of_membership_english_url: "https://example.com/membership-en.pdf",
                terms_of_membership_swedish_url: "https://example.com/membership-sv.pdf",
            });

            expect(getTermsOfMembershipUrl(settings, Language.english)).toBe(
                "https://example.com/membership-en.pdf",
            );
            expect(getTermsOfMembershipUrl(settings, Language.swedish)).toBe(
                "https://example.com/membership-sv.pdf",
            );
            expect(getTermsOfMembershipUrl(settings, "other" as Language)).toBeNull();
        });

        it("returns organization-specific terms of purchase URLs when present", () => {
            const settings = makeOrganizationSettings({
                terms_of_purchase_english_url: "https://example.com/purchase-en.pdf",
                terms_of_purchase_swedish_url: "https://example.com/purchase-sv.pdf",
            });

            expect(getTermsOfPurchaseUrl(settings, Language.english)).toBe(
                "https://example.com/purchase-en.pdf",
            );
            expect(getTermsOfPurchaseUrl(settings, Language.swedish)).toBe(
                "https://example.com/purchase-sv.pdf",
            );
        });

        it("falls back to bundled terms of purchase documents", () => {
            const settings = makeOrganizationSettings();

            expect(getTermsOfPurchaseUrl(settings, Language.english)).toBe(
                "documents/terms-of-purchase-english.pdf",
            );
            expect(getTermsOfPurchaseUrl(settings, Language.swedish)).toBe(
                "documents/terms-of-purchase-swedish.pdf",
            );
        });

        it("returns undefined for unsupported language in terms of purchase helper", () => {
            const settings = makeOrganizationSettings();

            expect(getTermsOfPurchaseUrl(settings, "other" as Language)).toBeUndefined();
        });
    });

    describe("skill badge helpers", () => {
        it("checks if a user has a specific skill badge", () => {
            const user = {
                skill_badges: [{ skill_badge_id: "badge-1" }, { skill_badge_id: "badge-2" }],
            } as any;

            expect(userHasSkillBadge(user, "badge-2")).toBe(true);
            expect(userHasSkillBadge(user, "badge-3")).toBe(false);
            expect(userHasSkillBadge(null, "badge-1")).toBe(false);
        });

        it("validates user qualification against all required task badges", () => {
            const user = {
                skill_badges: [{ skill_badge_id: "badge-1" }, { skill_badge_id: "badge-2" }],
            } as any;

            const requiredBadges = [
                { skill_badge_id: "badge-1" },
                { skill_badge_id: "badge-2" },
            ] as any;
            const missingOneBadge = [
                { skill_badge_id: "badge-1" },
                { skill_badge_id: "badge-3" },
            ] as any;

            expect(isUserQualifiedForTask(user, requiredBadges)).toBe(true);
            expect(isUserQualifiedForTask(user, missingOneBadge)).toBe(false);
            expect(isUserQualifiedForTask(user, [])).toBe(true);
        });
    });
});
