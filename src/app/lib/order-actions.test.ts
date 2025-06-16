import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import {
    getOrderById,
    getAllOrders,
    createOrder,
    updateOrderStatus,
    deleteOrder,
} from "./order-actions";
import { defaultActionState as defaultDatagridActionState } from "../ui/Datagrid";
import { defaultActionState as defaultFormActionState } from "../ui/form/Form";
import testdata from "../../test/testdata";

// Mock user-actions module
vi.mock("./user-actions", () => ({
    getLoggedInUser: vi.fn(() =>
        Promise.resolve({
            status: 200,
            errorMsg: "",
            result: JSON.stringify(testdata.user),
        }),
    ),
}));

beforeEach(() => {
    vi.resetAllMocks();
});

describe("Order Actions", () => {
    describe("getOrderById", () => {
        it("should get order by id with all related items", async () => {
            const mockOrder = testdata.order;
            mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(mockOrder);

            const result = await getOrderById(defaultDatagridActionState, mockOrder.id);
            expect(result.result[0]).toEqual(mockOrder);
            expect(result.status).toBe(200);
            expect(mockContext.prisma.order.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: mockOrder.id },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        });

        it("should handle errors when order not found", async () => {
            mockContext.prisma.order.findUniqueOrThrow.mockRejectedValue(
                new Error("Order not found"),
            );

            const result = await getOrderById(defaultDatagridActionState, "999");
            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Order not found");
            expect(result.result).toEqual([]);
        });
    });

    describe("getAllOrders", () => {
        it("should get all orders with related items", async () => {
            const mockOrders = [
                { ...testdata.order, id: "1" },
                { ...testdata.order, id: "2" },
            ];

            mockContext.prisma.order.findMany.mockResolvedValue(mockOrders);

            const result = await getAllOrders(defaultDatagridActionState);
            expect(result.status).toBe(200);
            expect(result.result).toEqual(mockOrders);
            expect(mockContext.prisma.order.findMany).toHaveBeenCalledWith({
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        });

        it("should handle get all orders error", async () => {
            mockContext.prisma.order.findMany.mockRejectedValue(new Error("Database error"));

            const result = await getAllOrders(defaultDatagridActionState);
            expect(result.status).toBe(500);
            expect(result.result).toEqual([]);
            expect(result.errorMsg).toBe("Database error");
        });
    });

    describe("createOrder", () => {
        it("should create a new order with items successfully", async () => {
            const userId = testdata.user.id;
            const orderItems = testdata.createOrderItems;
            const products = [
                testdata.product,
                { ...testdata.product, id: "prod-5678-9abc", price: 49.99 },
            ];
            const expectedTotalAmount = 249.97; // (99.99 * 2) + 49.99

            // Mock finding products
            mockContext.prisma.product.findMany.mockResolvedValue(products);

            // Mock transaction
            mockContext.prisma.$transaction.mockImplementation(async (callback) => {
                // Mock the transaction context with required methods
                const tx = {
                    order: {
                        create: vi
                            .fn()
                            .mockResolvedValue({ ...testdata.order, id: "#new-order", userId }),
                        update: vi.fn().mockResolvedValue({
                            ...testdata.order,
                            id: "#new-order",
                            totalAmount: expectedTotalAmount,
                            userId,
                        }),
                    },
                    orderItem: {
                        create: vi.fn().mockImplementation((data) => Promise.resolve(data)),
                    },
                };
                return callback(tx);
            });

            const result = await createOrder(defaultFormActionState, orderItems);

            expect(result.status).toBe(201);
            expect(result.result).toContain("#new-order");
            expect(mockContext.prisma.product.findMany).toHaveBeenCalledWith({
                where: {
                    id: {
                        in: Object.keys(orderItems),
                    },
                },
            });
        });

        it("should handle create order error when products not found", async () => {
            mockContext.prisma.product.findMany.mockResolvedValue([testdata.product]); // Only one product found

            const result = await createOrder(defaultFormActionState, testdata.createOrderItems);
            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Some products not found");
            expect(result.result).toBe("");
        });

        it("should handle database error during transaction", async () => {
            mockContext.prisma.product.findMany.mockResolvedValue([
                testdata.product,
                { ...testdata.product, id: "prod-5678-9abc" },
            ]);

            mockContext.prisma.$transaction.mockRejectedValue(new Error("Transaction failed"));

            const result = await createOrder(defaultFormActionState, testdata.createOrderItems);
            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Transaction failed");
            expect(result.result).toBe("");
        });

        it("should handle error when getting logged in user fails", async () => {
            // Mock getLoggedInUser to return an error
            const userActionsModule = await import("./user-actions");
            vi.mocked(userActionsModule.getLoggedInUser).mockResolvedValueOnce({
                status: 404,
                errorMsg: "User not found",
                result: "",
            });

            const orderItems = testdata.createOrderItems;
            const products = [
                testdata.product,
                { ...testdata.product, id: "prod-5678-9abc", price: 49.99 },
            ];

            // Mock finding products
            mockContext.prisma.product.findMany.mockResolvedValue(products);

            const result = await createOrder(defaultFormActionState, orderItems);
            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("User not found");
            expect(result.result).toBe("");
            expect(mockContext.prisma.$transaction).not.toHaveBeenCalled();
        });
    });

    describe("updateOrderStatus", () => {
        it("should update order status successfully", async () => {
            mockContext.prisma.order.update.mockResolvedValue({
                ...testdata.order,
                status: "paid",
            });

            const result = await updateOrderStatus("1", defaultFormActionState, "paid");
            expect(result.status).toBe(200);
            expect(result.result).toBe("Order status updated successfully");
            expect(mockContext.prisma.order.update).toHaveBeenCalledWith({
                where: { id: "1" },
                data: { status: "paid" },
            });
        });

        it("should handle update order status error", async () => {
            mockContext.prisma.order.update.mockRejectedValue(new Error("Update failed"));

            const result = await updateOrderStatus("1", defaultFormActionState, "paid");
            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Update failed");
        });
    });

    describe("deleteOrder", () => {
        it("should delete order and its items successfully", async () => {
            mockContext.prisma.$transaction.mockImplementation(async (callback) => {
                const tx = {
                    orderItem: {
                        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
                    },
                    order: {
                        delete: vi.fn().mockResolvedValue(testdata.order),
                    },
                };
                return callback(tx);
            });

            const result = await deleteOrder("1", defaultFormActionState);
            expect(result.status).toBe(200);
            expect(result.result).toBe("Order deleted successfully");
        });

        it("should handle delete order error", async () => {
            mockContext.prisma.$transaction.mockRejectedValue(new Error("Delete failed"));

            const result = await deleteOrder("1", defaultFormActionState);
            expect(result.status).toBe(500);
            expect(result.errorMsg).toBe("Delete failed");
        });
    });
});
