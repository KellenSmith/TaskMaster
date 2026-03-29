import { describe, expect, it, vi } from "vitest";
import dayjs from "dayjs";
import GlobalConstants from "../GlobalConstants";
import { mockContext } from "../../test/mocks/prismaMock";
import { revalidateTag } from "next/cache";
import * as membershipActions from "./user-membership-actions";
import { buildFormData } from "../../test/test-helpers";

vi.mock("./order-actions", () => ({
    createAndRedirectToOrder: vi.fn(),
}));

vi.mock("./user-actions", () => ({
    getLoggedInUser: vi.fn(),
    getUserLanguage: vi.fn(),
}));

describe("user-membership-actions", () => {
    const testUserId = "550e8400-e29b-41d4-a716-446655440000";

    describe("addUserMembership", () => {
        it("upserts membership and revalidates", async () => {
            const membershipProduct = { id: "membership-1", price: 0 } as any;
            mockContext.prisma.product.findFirst.mockResolvedValue(membershipProduct);
            mockContext.prisma.userMembership.upsert.mockResolvedValue({} as any);

            const formData = buildFormData({
                expires_at: "12/02/2026 10:00",
            });

            await membershipActions.addUserMembership(testUserId, formData);

            const expectedExpiresAt = dayjs("12/02/2026 10:00", "DD/MM/YYYY HH:mm", true).format();

            expect(mockContext.prisma.userMembership.upsert).toHaveBeenCalledWith({
                where: { user_id: testUserId, membership_id: "membership-1" },
                create: {
                    user: { connect: { id: testUserId } },
                    membership: { connect: { product_id: "membership-1" } },
                    expires_at: expectedExpiresAt,
                },
                update: { expires_at: expectedExpiresAt },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.USER, "max");
        });
    });
});
