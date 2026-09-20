import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import { startMembershipRenewal } from "./membership-actions";
import { getLoggedInUser, getUserLanguage } from "./user-helpers";
import { getMembershipProduct } from "./user-membership-helpers";
import { createAndRedirectToOrder } from "./order-actions";
import { getOrganizationSettings } from "./organization-settings-helpers";
import { Language, UserStatus } from "../../prisma/generated/enums";
import LanguageTranslations from "./membership-language-translations";

vi.mock("./user-helpers", () => ({
    getLoggedInUser: vi.fn(),
    getUserLanguage: vi.fn(),
}));
vi.mock("./user-membership-helpers", () => ({
    getMembershipProduct: vi.fn(),
}));
vi.mock("./order-actions", () => ({
    createAndRedirectToOrder: vi.fn(),
}));
vi.mock("./organization-settings-helpers", () => ({
    getOrganizationSettings: vi.fn(),
}));

const heldMembershipId = "550e8400-e29b-41d4-a716-446655440001";
const defaultMembershipId = "550e8400-e29b-41d4-a716-446655440002";

const buildUser = (overrides = {}) =>
    ({
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: UserStatus.validated,
        user_membership: { membership_id: heldMembershipId },
        blacklist_entry: null,
        ...overrides,
    }) as any;

describe("startMembershipRenewal", () => {
    beforeEach(() => {
        vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
        vi.mocked(getLoggedInUser).mockResolvedValue(buildUser());
        vi.mocked(getMembershipProduct).mockResolvedValue({ id: defaultMembershipId } as any);
        vi.mocked(getOrganizationSettings).mockResolvedValue({
            membership_ineligible_message: null,
        } as any);
        mockContext.prisma.membership.findUnique.mockResolvedValue({
            product_id: heldMembershipId,
        } as any);
    });

    it("throws when nobody is logged in", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);

        await expect(startMembershipRenewal()).rejects.toThrow(
            "User must be logged in to renew a membership",
        );
        expect(createAndRedirectToOrder).not.toHaveBeenCalled();
    });

    it("returns a localized message and creates no order for a blacklisted member", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(
            buildUser({ blacklist_entry: { expires_at: null } }),
        );
        vi.mocked(getUserLanguage).mockResolvedValue(Language.swedish);

        await expect(startMembershipRenewal()).resolves.toBe(
            LanguageTranslations.notEligible[Language.swedish],
        );
        expect(createAndRedirectToOrder).not.toHaveBeenCalled();
    });

    it("prefers the organization's own message for an ineligible member", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(
            buildUser({ blacklist_entry: { expires_at: null } }),
        );
        vi.mocked(getOrganizationSettings).mockResolvedValue({
            membership_ineligible_message: "Email us at hello@example.com",
        } as any);

        await expect(startMembershipRenewal()).resolves.toBe("Email us at hello@example.com");
    });

    it("returns a localized message for a member awaiting validation", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(buildUser({ status: UserStatus.pending }));

        await expect(startMembershipRenewal()).resolves.toBe(
            LanguageTranslations.awaitingValidation[Language.english],
        );
        expect(createAndRedirectToOrder).not.toHaveBeenCalled();
    });

    it("renews the membership product the user already holds", async () => {
        await expect(startMembershipRenewal()).resolves.toBeUndefined();

        expect(getMembershipProduct).not.toHaveBeenCalled();
        expect(createAndRedirectToOrder).toHaveBeenCalledWith([
            { product_id: heldMembershipId, quantity: 1 },
        ]);
    });

    it("falls back to the organization membership product when the held one is gone", async () => {
        mockContext.prisma.membership.findUnique.mockResolvedValue(null);

        await startMembershipRenewal();

        expect(createAndRedirectToOrder).toHaveBeenCalledWith([
            { product_id: defaultMembershipId, quantity: 1 },
        ]);
    });

    it("falls back to the organization membership product when the user never held one", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(buildUser({ user_membership: null }));

        await startMembershipRenewal();

        expect(mockContext.prisma.membership.findUnique).not.toHaveBeenCalled();
        expect(createAndRedirectToOrder).toHaveBeenCalledWith([
            { product_id: defaultMembershipId, quantity: 1 },
        ]);
    });

    it("does not swallow the redirect thrown on success", async () => {
        const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
            digest: "NEXT_REDIRECT;push;/order;307;",
        });
        vi.mocked(createAndRedirectToOrder).mockRejectedValue(redirectError);

        await expect(startMembershipRenewal()).rejects.toBe(redirectError);
    });
});
