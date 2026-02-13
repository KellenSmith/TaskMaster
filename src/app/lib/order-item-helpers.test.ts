import { describe, expect, it, vi } from "vitest";
import { OrderStatus } from "@/prisma/generated/client";
import { mockContext } from "../../test/mocks/prismaMock";
import { validateAndBuildOrderItems } from "./order-item-helpers";

const productId = "550e8400-e29b-41d4-a716-446655440002";

const tx = mockContext.prisma as any;

describe("order-item-helpers", () => {
    it("validates and builds order items correctly", async () => {
        const product = {
            id: productId,
            stock: 10, // No stock limit
            price: 2500,
            vat_percentage: 12,
            order_items: [
                {
                    quantity: 1,
                    order: {
                        status: OrderStatus.pending,
                        created_at: new Date(),
                    },
                },
            ],
        };
        tx.product.findMany.mockResolvedValue([product]);
        const orderItems = [
            {
                product_id: productId,
                quantity: 5,
            },
        ];
        const result = await validateAndBuildOrderItems(tx, orderItems);
        expect(result[0].price).toBe(2500);
        expect(result[0].vat_amount).toBe(0.12 * 2500);
        expect(result[0].quantity).toBe(5);
    });
    it("handles product with no stock limit (null stock)", async () => {
        const product = {
            id: productId,
            stock: null, // No stock limit
            price: 2500,
            vat_percentage: 12,
            order_items: [
                {
                    quantity: 1,
                    order: {
                        status: OrderStatus.pending,
                        created_at: new Date(),
                    },
                },
            ],
        };
        tx.product.findMany.mockResolvedValue([product]);
        const orderItems = [
            {
                product_id: productId,
                quantity: 100,
            },
        ];
        const result = await validateAndBuildOrderItems(tx, orderItems);
        expect(result[0].price).toBe(2500);
        expect(result[0].vat_amount).toBe(0.12 * 2500);
        expect(result[0].quantity).toBe(100);
    });
    it("throws error when product has insufficient stock", async () => {
        const product = {
            id: productId,
            stock: 5,
            price: 1000,
            vat_percentage: 6,
            order_items: [
                {
                    quantity: 5,
                    order: {
                        status: OrderStatus.pending,
                        created_at: new Date(),
                    },
                },
            ],
        };
        tx.product.findMany.mockResolvedValue([product]);
        const orderItems = [
            {
                product_id: productId,
                quantity: 10,
            },
        ];
        await expect(validateAndBuildOrderItems(tx, orderItems)).rejects.toThrow(
            `Insufficient stock for product ${productId}`,
        );
    });
    it("throws error when quantity is zero", async () => {
        const product = {
            id: productId,
            stock: 10,
            price: 1000,
            vat_percentage: 6,
            order_items: [
                {
                    quantity: 1,
                    order: {
                        status: OrderStatus.pending,
                        created_at: new Date(),
                    },
                },
            ],
        };
        tx.product.findMany.mockResolvedValue([product]);
        const orderItems = [
            {
                product_id: productId,
                quantity: 0,
            },
        ];
        await expect(validateAndBuildOrderItems(tx, orderItems)).rejects.toThrow(
            `Invalid quantity for product ${productId}`,
        );
    });
    it("throws error when quantity is negative", async () => {
        const product = {
            id: productId,
            stock: 10,
            price: 1000,
            vat_percentage: 6,
            order_items: [
                {
                    quantity: 1,
                    order: {
                        status: OrderStatus.pending,
                        created_at: new Date(),
                    },
                },
            ],
        };
        tx.product.findMany.mockResolvedValue([product]);
        const orderItems = [
            {
                product_id: productId,
                quantity: -5,
            },
        ];
        await expect(validateAndBuildOrderItems(tx, orderItems)).rejects.toThrow();
    });
    it("throws error when quantity is undefined", async () => {
        const product = {
            id: productId,
            stock: 10,
            price: 1000,
            vat_percentage: 6,
            order_items: [
                {
                    quantity: 1,
                    order: {
                        status: OrderStatus.pending,
                        created_at: new Date(),
                    },
                },
            ],
        };
        tx.product.findMany.mockResolvedValue([product]);
        const orderItems = [
            {
                product_id: productId,
                quantity: undefined as any,
            },
        ];
        await expect(validateAndBuildOrderItems(tx, orderItems)).rejects.toThrow(
            `Invalid quantity for product ${productId}`,
        );
    });
});
