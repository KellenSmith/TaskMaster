import { describe, expect, it, vi } from "vitest";
import dayjs from "dayjs";
import GlobalConstants from "../GlobalConstants";
import { mockContext } from "../../test/mocks/prismaMock";
import type { TransactionClient } from "../../test/types/test-types";
import { revalidateTag } from "next/cache";
import * as membershipActions from "./user-membership-helpers";
import { isMembershipExpired } from "./utils";

vi.mock("./order-actions", () => ({
    createAndRedirectToOrder: vi.fn(),
}));

vi.mock("./user-actions", () => ({
    getLoggedInUser: vi.fn(),
    getUserLanguage: vi.fn(),
}));

vi.mock("./utils", () => ({
    isMembershipExpired: vi.fn(),
}));

describe("user-membership-helpers", () => {
    const testUserId = "550e8400-e29b-41d4-a716-446655440000";

    describe("renewUserMembership", () => {
        it("creates a new expiry when expired or membership changes", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.membership.findUniqueOrThrow).mockResolvedValue({
                duration: 365,
            } as any);
            vi.mocked(tx.userMembership.findUnique).mockResolvedValue({
                membership_id: "membership-1",
                expires_at: "2025-01-01T00:00:00.000Z",
            } as any);
            vi.mocked(tx.user.findUniqueOrThrow).mockResolvedValue({
                id: testUserId,
                user_membership: { expires_at: "2025-01-01T00:00:00.000Z" },
            } as any);
            vi.mocked(isMembershipExpired).mockReturnValue(true);

            await membershipActions.renewUserMembership(tx as any, testUserId, "membership-1");

            const expectedExpiresAt = dayjs("2026-02-12T00:00:00Z").add(365, "d").toISOString();

            expect(tx.userMembership.upsert).toHaveBeenCalledWith({
                where: { user_id: testUserId },
                update: {
                    membership_id: "membership-1",
                    expires_at: expectedExpiresAt,
                },
                create: {
                    user_id: testUserId,
                    membership_id: "membership-1",
                    expires_at: expectedExpiresAt,
                },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.USER, "max");
        });

        it("extends expiry when membership is active and unchanged", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            vi.mocked(tx.membership.findUniqueOrThrow).mockResolvedValue({
                duration: 365,
            } as any);
            vi.mocked(tx.userMembership.findUnique).mockResolvedValue({
                membership_id: "membership-1",
                expires_at: "2026-03-01T00:00:00.000Z",
            } as any);
            vi.mocked(tx.user.findUniqueOrThrow).mockResolvedValue({
                id: testUserId,
                user_membership: { expires_at: "2026-03-01T00:00:00.000Z" },
            } as any);
            vi.mocked(isMembershipExpired).mockReturnValue(false);

            await membershipActions.renewUserMembership(tx as any, testUserId, "membership-1");

            const expectedExpiresAt = dayjs("2026-03-01T00:00:00.000Z").add(365, "d").toISOString();

            expect(tx.userMembership.upsert).toHaveBeenCalledWith({
                where: { user_id: testUserId },
                update: {
                    membership_id: "membership-1",
                    expires_at: expectedExpiresAt,
                },
                create: {
                    user_id: testUserId,
                    membership_id: "membership-1",
                    expires_at: expectedExpiresAt,
                },
            });
        });
    });

    describe("getMembershipProduct", () => {
        it("returns an existing membership product", async () => {
            const existing = { id: "membership-1", price: 0 } as any;
            mockContext.prisma.product.findFirst.mockResolvedValue(existing);

            const result = await membershipActions.getMembershipProduct();

            expect(mockContext.prisma.product.findFirst).toHaveBeenCalledWith({
                where: { membership: { isNot: null } },
                select: { id: true, price: true },
            });
            expect(mockContext.prisma.product.create).not.toHaveBeenCalled();
            expect(result).toBe(existing);
        });

        it("creates the membership product when missing", async () => {
            const created = { id: "membership-2", price: 0 } as any;
            mockContext.prisma.product.findFirst.mockResolvedValue(null);
            mockContext.prisma.product.create.mockResolvedValue(created);

            const result = await membershipActions.getMembershipProduct();

            expect(mockContext.prisma.product.create).toHaveBeenCalledWith({
                data: {
                    name: GlobalConstants.MEMBERSHIP_PRODUCT_NAME,
                    description: "Annual membership",
                    price: 0,
                    stock: null,
                    membership: { create: { duration: 365 } },
                },
                select: { id: true, price: true },
            });
            expect(result).toBe(created);
        });
    });
});
