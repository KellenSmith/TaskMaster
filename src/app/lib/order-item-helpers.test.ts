import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateAndBuildOrderItems, processOrderItems } from "./order-item-helpers";
import { getAvailableProductStock, processOrderedProduct } from "./product-helpers";
import { OrderStatus, Prisma } from "../../prisma/generated/client";

// Mocks
vi.mock("./zod-schemas", () => ({
    UuidSchema: { parse: vi.fn((id) => id) },
}));
vi.mock("./product-helpers", () => ({
    getAvailableProductStock: vi.fn(),
    processOrderedProduct: vi.fn(),
}));

const mockTx = {
    product: {
        findMany: vi.fn(),
    },
} as unknown as Prisma.TransactionClient;

describe("order-item-helpers", () => {
    describe("validateAndBuildOrderItems", () => {
        const baseProduct = {
            id: "prod-1",
            stock: 10,
            price: 100,
            vat_percentage: 25,
            order_items: [],
        };
        const baseOrderItem = {
            product_id: "prod-1",
            quantity: 2,
        };

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it("validates and builds order items with correct price and vat", async () => {
            (mockTx.product.findMany as any).mockResolvedValue([baseProduct]);
            (getAvailableProductStock as any).mockReturnValue(10);
            const items = [{ ...baseOrderItem }];
            const result = await validateAndBuildOrderItems(mockTx, items);
            expect(result[0].price).toBe(baseProduct.price);
            expect(result[0].vat_amount).toBeCloseTo(
                (baseProduct.vat_percentage / 100) * baseProduct.price,
            );
        });

        it("throws if product not found", async () => {
            (mockTx.product.findMany as any).mockResolvedValue([]);
            await expect(validateAndBuildOrderItems(mockTx, [baseOrderItem])).rejects.toThrow(
                "Product with id prod-1 not found",
            );
        });

        it("throws if quantity is invalid", async () => {
            (mockTx.product.findMany as any).mockResolvedValue([baseProduct]);
            (getAvailableProductStock as any).mockReturnValue(10);
            await expect(
                validateAndBuildOrderItems(mockTx, [{ ...baseOrderItem, quantity: 0 }]),
            ).rejects.toThrow("Invalid quantity for product prod-1");
            await expect(
                validateAndBuildOrderItems(mockTx, [{ ...baseOrderItem, quantity: -1 }]),
            ).rejects.toThrow("Invalid quantity for product prod-1");
            await expect(
                validateAndBuildOrderItems(mockTx, [{ ...baseOrderItem, quantity: undefined }]),
            ).rejects.toThrow("Invalid quantity for product prod-1");
        });

        it("throws if insufficient stock", async () => {
            (mockTx.product.findMany as any).mockResolvedValue([baseProduct]);
            (getAvailableProductStock as any).mockReturnValue(1);
            await expect(validateAndBuildOrderItems(mockTx, [baseOrderItem])).rejects.toThrow(
                "Insufficient stock for product prod-1",
            );
        });

        it("allows null stock (unlimited)", async () => {
            (mockTx.product.findMany as any).mockResolvedValue([baseProduct]);
            (getAvailableProductStock as any).mockReturnValue(null);
            const items = [{ ...baseOrderItem }];
            const result = await validateAndBuildOrderItems(mockTx, items);
            expect(result[0].price).toBe(baseProduct.price);
        });
    });

    describe("processOrderItems", () => {
        // Minimal valid product structure for test
        const minimalProduct = {
            id: "prod-1",
            stock: 10,
            price: 100,
            vat_percentage: 25,
            order_items: [],
            membership: null,
            ticket: null,
            name: "Test Product",
            description: null,
            image_url: null,
        };
        const order = {
            id: "order-1",
            status: OrderStatus.pending,
            user_id: "user-1",
            order_items: [
                {
                    product: minimalProduct,
                    price: 100,
                    quantity: 1,
                    vat_amount: 25,
                    order_id: "order-1",
                    product_id: "prod-1",
                },
            ],
        };

        it("throws if no items", async () => {
            await expect(processOrderItems(mockTx, { ...order, order_items: [] })).rejects.toThrow(
                "No items found for order order-1",
            );
        });
        it("throws if no user_id", async () => {
            await expect(processOrderItems(mockTx, { ...order, user_id: null })).rejects.toThrow(
                "Order order-1 has no associated user",
            );
        });
        it("calls processOrderedProduct for each item", async () => {
            await processOrderItems(mockTx, order as any);
            expect(processOrderedProduct).toHaveBeenCalledTimes(1);
            expect(processOrderedProduct).toHaveBeenCalledWith(
                mockTx,
                order.user_id,
                order.order_items[0],
            );
        });
    });
});
