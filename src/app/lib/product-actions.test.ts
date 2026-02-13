import { describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { mockContext } from "../../test/mocks/prismaMock";
import { buildFormData } from "../../test/test-helpers";
import * as productActions from "./product-actions";
import { sanitizeFormData } from "./html-sanitizer";
import { deleteOldBlob } from "./organization-settings-actions";

vi.mock("./html-sanitizer", () => ({
    sanitizeFormData: vi.fn(),
}));

vi.mock("./organization-settings-actions", () => ({
    deleteOldBlob: vi.fn(),
}));

vi.mock("./utils", () => ({
    getAbsoluteUrl: vi.fn().mockReturnValue("https://example.com/order?id=123"),
}));

const productId = "550e8400-e29b-41d4-a716-446655440000";
const userId = "550e8400-e29b-41d4-a716-446655440001";

const baseProductForm = {
    name: "T-Shirt",
    description: "<p>Cool shirt</p>",
    price: "25",
    vat_percentage: "6",
    stock: "50",
    image_url: "https://example.com/shirt.png",
};

describe("product-actions", () => {
    describe("createProduct", () => {
        it("creates product, sanitizes, and revalidates", async () => {
            const sanitized = {
                name: "T-Shirt",
                description: "<p>Cool shirt</p>",
                price: 2500,
                vat_percentage: 6,
                stock: 50,
                image_url: "https://example.com/shirt.png",
            };

            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.product.create.mockResolvedValue({ id: productId } as any);

            const formData = buildFormData(baseProductForm);

            await productActions.createProduct(formData);

            expect(vi.mocked(sanitizeFormData)).toHaveBeenCalled();
            expect(mockContext.prisma.product.create).toHaveBeenCalledWith({
                data: sanitized,
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.PRODUCT, "max");
        });

        it("rejects invalid input", async () => {
            const formData = buildFormData({ name: "Test" });

            await expect(productActions.createProduct(formData)).rejects.toThrow();
        });
    });

    describe("createMembershipProduct", () => {
        it("creates membership product and revalidates", async () => {
            const sanitized = {
                name: "Annual Membership",
                description: "<p>Full access</p>",
                price: 10000,
                vat_percentage: 6,
            };

            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.membership.create.mockResolvedValue({
                product_id: productId,
            } as any);

            const formData = buildFormData({
                ...baseProductForm,
                duration: "365",
            });

            await productActions.createMembershipProduct(formData);

            expect(mockContext.prisma.membership.create).toHaveBeenCalledWith({
                data: {
                    duration: 365,
                    product: {
                        create: sanitized,
                    },
                },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.PRODUCT, "max");
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.MEMBERSHIP,
                "max",
            );
        });

        it("rejects invalid input", async () => {
            const formData = buildFormData({ name: "Test" });

            await expect(productActions.createMembershipProduct(formData)).rejects.toThrow();
        });
    });

    describe("updateMembershipProduct", () => {
        it("updates membership product and revalidates", async () => {
            const sanitized = {
                name: "Updated Membership",
                price: 15000,
            };

            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.membership.update.mockResolvedValue({
                product_id: productId,
            } as any);

            const formData = buildFormData({
                name: "Updated Membership",
                price: "150",
                vat_percentage: "6",
                duration: "365",
            });

            await productActions.updateMembershipProduct(productId, formData);

            expect(mockContext.prisma.membership.update).toHaveBeenCalledWith({
                where: { product_id: productId },
                data: {
                    duration: 365,
                    product: {
                        update: sanitized,
                    },
                },
            });
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.PRODUCT, "max");
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.MEMBERSHIP,
                "max",
            );
        });

        it("deletes old blob when updating membership product image URL", async () => {
            const oldImageUrl = "https://blob.vercel-storage.com/old-membership.png";
            const newImageUrl = "https://blob.vercel-storage.com/new-membership.png";

            const sanitized = {
                name: "Updated Membership",
                image_url: newImageUrl,
            };

            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.product.findUniqueOrThrow.mockResolvedValue({
                id: productId,
                image_url: oldImageUrl,
            } as any);
            mockContext.prisma.membership.update.mockResolvedValue({
                product_id: productId,
            } as any);

            const formData = buildFormData({
                name: "Updated Membership",
                price: "150",
                vat_percentage: "6",
                image_url: newImageUrl,
                duration: "365",
            });

            await productActions.updateMembershipProduct(productId, formData);

            expect(vi.mocked(deleteOldBlob)).toHaveBeenCalledWith(oldImageUrl, newImageUrl);
        });

        it("deletes old blob when removing membership product image URL", async () => {
            const oldImageUrl = "https://blob.vercel-storage.com/old-membership.png";

            const sanitized = {
                name: "Updated Membership",
                image_url: "",
            };

            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.product.findUniqueOrThrow.mockResolvedValue({
                id: productId,
                image_url: oldImageUrl,
            } as any);
            mockContext.prisma.membership.update.mockResolvedValue({
                product_id: productId,
            } as any);

            const formData = buildFormData({
                name: "Updated Membership",
                price: "150",
                vat_percentage: "6",
                image_url: "",
                duration: "365",
            });

            await productActions.updateMembershipProduct(productId, formData);

            expect(vi.mocked(deleteOldBlob)).toHaveBeenCalledWith(oldImageUrl, "");
        });

        it("does not delete blob when image_url not in membership update", async () => {
            const oldImageUrl = "https://blob.vercel-storage.com/old-membership.png";

            const sanitized = {
                name: "Updated Membership",
                price: 15000,
            };

            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.product.findUniqueOrThrow.mockResolvedValue({
                id: productId,
                image_url: oldImageUrl,
            } as any);
            mockContext.prisma.membership.update.mockResolvedValue({
                product_id: productId,
            } as any);

            const formData = buildFormData({
                name: "Updated Membership",
                price: "150",
                vat_percentage: "6",
                duration: "365",
            });

            await productActions.updateMembershipProduct(productId, formData);

            expect(vi.mocked(deleteOldBlob)).not.toHaveBeenCalled();
        });

        it("rejects invalid product id", async () => {
            const formData = buildFormData(baseProductForm);

            await expect(
                productActions.updateMembershipProduct("not-a-uuid", formData),
            ).rejects.toThrow();
        });
    });

    describe("updateProduct", () => {
        it("updates product, deletes old blob, and revalidates", async () => {
            const sanitized = {
                name: "Updated T-Shirt",
                image_url: "https://blob.vercel-storage.com/new.png",
            };

            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.product.findUniqueOrThrow.mockResolvedValue({
                id: productId,
                image_url: "https://blob.vercel-storage.com/old.png",
            } as any);
            mockContext.prisma.product.update.mockResolvedValue({ id: productId } as any);

            const formData = buildFormData({
                name: "Updated T-Shirt",
                vat_percentage: "6",
                image_url: "https://blob.vercel-storage.com/new.png",
            });

            await productActions.updateProduct(productId, formData);

            expect(mockContext.prisma.product.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: productId },
            });
            expect(mockContext.prisma.product.update).toHaveBeenCalledWith({
                where: { id: productId },
                data: sanitized,
            });
            expect(vi.mocked(deleteOldBlob)).toHaveBeenCalledWith(
                "https://blob.vercel-storage.com/old.png",
                "https://blob.vercel-storage.com/new.png",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.PRODUCT, "max");
        });

        it("does not delete blob when image_url not in update", async () => {
            const sanitized = {
                name: "Updated T-Shirt",
                price: 3000,
            };

            vi.mocked(sanitizeFormData).mockReturnValue(sanitized as any);
            mockContext.prisma.product.findUniqueOrThrow.mockResolvedValue({
                id: productId,
                image_url: "https://blob.vercel-storage.com/old.png",
            } as any);
            mockContext.prisma.product.update.mockResolvedValue({ id: productId } as any);

            const formData = buildFormData({
                name: "Updated T-Shirt",
                price: "30",
                vat_percentage: "6",
            });

            await productActions.updateProduct(productId, formData);

            expect(vi.mocked(deleteOldBlob)).not.toHaveBeenCalled();
        });

        it("rejects invalid product id", async () => {
            const formData = buildFormData(baseProductForm);

            await expect(productActions.updateProduct("not-a-uuid", formData)).rejects.toThrow();
        });
    });

    describe("deleteProduct", () => {
        it("deletes product and revalidates", async () => {
            mockContext.prisma.product.delete.mockResolvedValue({
                id: productId,
                image_url: "https://blob.vercel-storage.com/old.png",
                membership: null,
                ticket: null,
            } as any);

            await productActions.deleteProduct(productId);

            expect(mockContext.prisma.product.delete).toHaveBeenCalledWith({
                where: { id: productId },
                include: { membership: true, ticket: true },
            });
            expect(vi.mocked(deleteOldBlob)).toHaveBeenCalledWith(
                "https://blob.vercel-storage.com/old.png",
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.PRODUCT, "max");
        });

        it("revalidates membership cache when deleting membership product", async () => {
            mockContext.prisma.product.delete.mockResolvedValue({
                id: productId,
                image_url: null,
                membership: { product_id: productId },
                ticket: null,
            } as any);

            await productActions.deleteProduct(productId);

            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(
                GlobalConstants.MEMBERSHIP,
                "max",
            );
        });

        it("revalidates ticket cache when deleting ticket product", async () => {
            mockContext.prisma.product.delete.mockResolvedValue({
                id: productId,
                image_url: null,
                membership: null,
                ticket: { product_id: productId },
            } as any);

            await productActions.deleteProduct(productId);

            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.TICKET, "max");
        });

        it("rejects invalid product id", async () => {
            await expect(productActions.deleteProduct("not-a-uuid")).rejects.toThrow();
        });
    });
});
