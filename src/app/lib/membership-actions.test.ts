import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import { startMembershipRenewal } from "./membership-actions";
import { getLoggedInUser, getUserLanguage } from "./user-helpers";
import { getMembershipProduct } from "./user-membership-helpers";
import { createAndRedirectToOrder } from "./order-actions";
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

const currentProductId = "550e8400-e29b-41d4-a716-446655440001";
const defaultProductId = "550e8400-e29b-41d4-a716-446655440002";
const requestedProductId = "550e8400-e29b-41d4-a716-446655440003";

const validatedUser = (overrides: Record<string, unknown> = {}) =>
    ({
        id: "user-1",
        status: UserStatus.validated,
        user_membership: null,
        blacklist_entry: null,
        ...overrides,
    }) as any;

/** Makes exactly these membership products exist in the mocked database. */
const membershipsExist = (...productIds: string[]) => {
    mockContext.prisma.membership.findUnique.mockImplementation(((args: {
        where: { product_id: string };
    }) =>
        Promise.resolve(
            productIds.includes(args.where.product_id)
                ? { product_id: args.where.product_id }
                : null,
        )) as any);
    mockContext.prisma.membership.count.mockResolvedValue(productIds.length);
};

describe("startMembershipRenewal", () => {
    beforeEach(() => {
        vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
        vi.mocked(getMembershipProduct).mockResolvedValue({ id: defaultProductId } as any);
        vi.mocked(getLoggedInUser).mockResolvedValue(validatedUser());
        membershipsExist(defaultProductId);
    });

    it("throws when not logged in", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);
        await expect(startMembershipRenewal()).rejects.toThrow();
        expect(createAndRedirectToOrder).not.toHaveBeenCalled();
    });

    it("returns a localized message and creates no order for blacklisted users", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(
            validatedUser({ blacklist_entry: { expires_at: null } }),
        );
        vi.mocked(getUserLanguage).mockResolvedValue(Language.swedish);
        await expect(startMembershipRenewal()).resolves.toBe(
            LanguageTranslations.notEligible[Language.swedish],
        );
        expect(createAndRedirectToOrder).not.toHaveBeenCalled();
    });

    it("returns a localized message and creates no order for pending users", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(validatedUser({ status: UserStatus.pending }));
        await expect(startMembershipRenewal()).resolves.toBe(
            LanguageTranslations.awaitingValidation[Language.english],
        );
        expect(createAndRedirectToOrder).not.toHaveBeenCalled();
    });

    it("orders the organization default when the user never held a membership", async () => {
        await startMembershipRenewal();
        expect(getMembershipProduct).toHaveBeenCalled();
        expect(createAndRedirectToOrder).toHaveBeenCalledWith([
            { product_id: defaultProductId, quantity: 1 },
        ]);
    });

    it("renews the product the user already holds", async () => {
        membershipsExist(currentProductId, defaultProductId);
        vi.mocked(getLoggedInUser).mockResolvedValue(
            validatedUser({ user_membership: { membership_id: currentProductId } }),
        );
        await startMembershipRenewal();
        expect(getMembershipProduct).not.toHaveBeenCalled();
        expect(createAndRedirectToOrder).toHaveBeenCalledWith([
            { product_id: currentProductId, quantity: 1 },
        ]);
    });

    it("falls back to the default when the held product no longer exists", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(
            validatedUser({ user_membership: { membership_id: currentProductId } }),
        );
        await startMembershipRenewal();
        expect(createAndRedirectToOrder).toHaveBeenCalledWith([
            { product_id: defaultProductId, quantity: 1 },
        ]);
    });

    it("orders an explicitly requested membership product", async () => {
        membershipsExist(requestedProductId, currentProductId);
        vi.mocked(getLoggedInUser).mockResolvedValue(
            validatedUser({ user_membership: { membership_id: currentProductId } }),
        );
        await startMembershipRenewal(requestedProductId);
        expect(createAndRedirectToOrder).toHaveBeenCalledWith([
            { product_id: requestedProductId, quantity: 1 },
        ]);
    });

    it("ignores a requested product that is not a uuid or not a membership", async () => {
        membershipsExist(currentProductId, defaultProductId);
        vi.mocked(getLoggedInUser).mockResolvedValue(
            validatedUser({ user_membership: { membership_id: currentProductId } }),
        );
        await startMembershipRenewal("not-a-uuid");
        await startMembershipRenewal(requestedProductId);
        expect(createAndRedirectToOrder).toHaveBeenCalledTimes(2);
        expect(createAndRedirectToOrder).toHaveBeenLastCalledWith([
            { product_id: currentProductId, quantity: 1 },
        ]);
    });

    it("asks the user to choose when several products exist and none can be inferred", async () => {
        membershipsExist(currentProductId, defaultProductId);
        await expect(startMembershipRenewal()).resolves.toBe(
            LanguageTranslations.membershipChoiceRequired[Language.english],
        );
        expect(getMembershipProduct).not.toHaveBeenCalled();
        expect(createAndRedirectToOrder).not.toHaveBeenCalled();
    });

    it("does not swallow the redirect thrown on success", async () => {
        vi.mocked(createAndRedirectToOrder).mockRejectedValue(new Error("NEXT_REDIRECT"));
        await expect(startMembershipRenewal()).rejects.toThrow("NEXT_REDIRECT");
    });
});
