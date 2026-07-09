import { describe, expect, it, vi } from "vitest";
import dayjs from "dayjs";
import GlobalConstants from "../GlobalConstants";
import { mockContext } from "../../test/mocks/prismaMock";
import { revalidateTag } from "next/cache";
import * as membershipActions from "./user-membership-actions";
import { buildFormData } from "../../test/test-helpers";
import { dateDisplayFormat } from "../context/LocalizationContext";
import { getLoggedInUser } from "./user-helpers";
import { UserRole } from "../../prisma/generated/enums";

vi.mock("./order-actions", () => ({
    createAndRedirectToOrder: vi.fn(),
}));

vi.mock("./user-helpers", () => ({
    getLoggedInUser: vi.fn(),
    getUserLanguage: vi.fn(),
}));

describe("user-membership-actions", () => {
    const testUUID = "550e8400-e29b-41d4-a716-446655440000";

    describe("addUserMembership", () => {
        it("upserts membership and revalidates", async () => {
            vi.mocked(getLoggedInUser).mockResolvedValue({
                id: "admin-user-id",
                role: UserRole.admin,
                user_membership: { expires_at: dayjs.utc().add(1, "year").toDate() },
            } as any);
            const membershipProduct = { id: "membership-1", price: 0 } as any;
            mockContext.prisma.product.findFirst.mockResolvedValue(membershipProduct);
            mockContext.prisma.userMembership.upsert.mockResolvedValue({} as any);

            const formData = buildFormData({
                expires_at: "2026/02/12 10:00",
                membership_id: testUUID,
            });

            await membershipActions.addUserMembership(testUUID, formData);

            const expectedExpiresAt = dayjs
                .utc("2026/02/12 10:00", dateDisplayFormat, true)
                .format();

            expect(mockContext.prisma.userMembership.upsert).toHaveBeenCalledWith({
                where: { user_id: testUUID },
                create: {
                    user: { connect: { id: testUUID } },
                    membership: { connect: { product_id: testUUID } },
                    expires_at: expectedExpiresAt,
                },
                update: { expires_at: expectedExpiresAt, membership_id: testUUID },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.USER, "max");
        });
    });
});
