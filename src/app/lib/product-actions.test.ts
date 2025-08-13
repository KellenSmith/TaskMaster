import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import {
    getProductById,
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    createMembershipProduct,
} from "./product-actions";
import testdata from "../../test/testdata";
import { defaultDatagridActionState, defaultFormActionState } from "./definitions";
import { Product } from "@prisma/client";

beforeEach(() => {
    vi.resetAllMocks();
});

describe("Product Actions", () => {
    describe("getProductById", () => {
        it("should get product by id", async () => {
            const mockProduct = testdata.product;
            mockContext.prisma.product.findUniqueOrThrow.mockResolvedValue(mockProduct);

            const result = await getProductById(defaultDatagridActionState, mockProduct.id);
            expect(result.result[0]).toEqual(mockProduct);
            expect(result.status).toBe(200);
            expect(mockContext.prisma.product.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: mockProduct.id },
            });
        });

        it("should handle errors when product not found", async () => {
            mockContext.prisma.product.findUniqueOrThrow.mockRejectedValue(
                new Error("Product not found"),
            );

            const result = await getProductById(defaultDatagridActionState, "999");
            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Product not found");
            expect(result.result).toEqual([]);
        });
    });

    describe("getAllProducts", () => {
        it("should get all products", async () => {
            const mockProducts = [
                { ...testdata.product, id: "1" },
                { ...testdata.product, id: "2" },
            ];

            mockContext.prisma.product.findMany.mockResolvedValue(mockProducts);

            const result = await getAllProducts(defaultDatagridActionState);
            expect(result.status).toBe(200);
            expect(result.result).toEqual(mockProducts);
            expect(mockContext.prisma.product.findMany).toHaveBeenCalled();
        });

        it("should handle get all products error", async () => {
            mockContext.prisma.product.findMany.mockRejectedValue(new Error("Database error"));

            const result = await getAllProducts(defaultDatagridActionState);
            expect(result.status).toBe(500);
            expect(result.result).toEqual([]);
            expect(result.errorMsg).toBe("Database error");
        });
    });

    describe("createProduct", () => {
        it("should create a new product successfully", async () => {
            const productToCreate = testdata.createProduct;
            const createdProduct = { ...testdata.product, ...productToCreate };

            mockContext.prisma.product.create.mockResolvedValue(createdProduct);

            const result = await createProduct(defaultFormActionState, productToCreate);
            expect(result.status).toBe(201);
            expect(result.result).toContain("created successfully");
            expect(mockContext.prisma.product.create).toHaveBeenCalledWith({
                data: productToCreate,
            });
        });

        it("should handle create product errors", async () => {
            mockContext.prisma.product.create.mockRejectedValue(new Error("Creation failed"));

            const result = await createProduct(defaultFormActionState, testdata.createProduct);
            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Creation failed");
        });
    });

    describe("updateProduct", () => {
        it("should update product successfully", async () => {
            const mockUpdate = {
                name: "Updated Product",
                price: 199.99,
            };

            mockContext.prisma.product.update.mockResolvedValue({
                ...testdata.product,
                ...mockUpdate,
            });

            const result = await updateProduct("1", defaultFormActionState, mockUpdate);
            expect(result.status).toBe(200);
            expect(result.result).toBe("Updated successfully");
            expect(mockContext.prisma.product.update).toHaveBeenCalledWith({
                where: { id: "1" },
                data: mockUpdate,
            });
        });

        it("should handle update product error", async () => {
            mockContext.prisma.product.update.mockRejectedValue(new Error("Update failed"));

            const result = await updateProduct("1", defaultFormActionState, { name: "test" });
            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Update failed");
        });
    });

    describe("deleteProduct", () => {
        it("should delete product successfully", async () => {
            mockContext.prisma.product.delete.mockResolvedValue(testdata.product);

            const result = await deleteProduct(testdata.product, defaultFormActionState);
            expect(result.status).toBe(200);
            expect(result.result).toBe("Deleted successfully");
            expect(mockContext.prisma.product.delete).toHaveBeenCalledWith({
                where: { id: "prod-1234-5678" },
            });
        });

        it("should handle delete product error", async () => {
            mockContext.prisma.product.delete.mockRejectedValue(new Error("Delete failed"));

            const result = await deleteProduct(testdata.product, defaultFormActionState);
            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Delete failed");
        });
    });

    describe("createMembershipProduct", () => {
        it("should create a new membership product successfully", async () => {
            const testFieldValues = {
                ...testdata.createProduct,
                ...testdata.createMembership,
            };
            const createdProduct = {
                ...testdata.product,
                Membership: {
                    duration: 365,
                },
            };

            mockContext.prisma.product.create.mockResolvedValue(createdProduct);

            const result = await createMembershipProduct(defaultFormActionState, testFieldValues);
            expect(result.status).toBe(201);
            expect(result.result).toContain("Membership Product");
            expect(result.result).toContain("created successfully");
            expect(mockContext.prisma.product.create).toHaveBeenCalledWith({
                data: {
                    ...testFieldValues,
                    Membership: {
                        create: {
                            duration: 365,
                        },
                    },
                },
            });
        });

        it("should handle create membership product errors", async () => {
            const productToCreate = {
                ...testdata.createProduct,
                duration: 365,
            };
            mockContext.prisma.product.create.mockRejectedValue(new Error("Creation failed"));

            const result = await createMembershipProduct(defaultFormActionState, productToCreate);
            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Creation failed");
        });
    });
});
