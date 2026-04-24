import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../GlobalConstants";
import { mockContext } from "../../test/mocks/prismaMock";
import * as orderActions from "./order-actions";
import { getLoggedInUser } from "./user-helpers";
import { serverRedirect } from "./utils";
import { OrderStatus, UserRole } from "../../prisma/generated/enums";
import dayjs from "./dayjs";

vi.mock("./user-helpers", () => ({
    getLoggedInUser: vi.fn(),
}));

vi.mock("./utils", () => ({
    serverRedirect: vi.fn(),
}));

const userId = "550e8400-e29b-41d4-a716-446655440001";
const productId = "550e8400-e29b-41d4-a716-446655440002";
const orderId = "550e8400-e29b-41d4-a716-446655440003";
const adminUserId = "550e8400-e29b-41d4-a716-446655440004";

describe("order-actions", () => {
    beforeEach(() => {
        vi.mocked(getLoggedInUser).mockResolvedValue({
            id: userId,
            role: UserRole.member,
        } as any);
    });

    describe("createAndRedirectToOrder", () => {
        it("creates order with valid items and redirects", async () => {
            const product = {
                id: productId,
                stock: 10,
                price: 5000, // 50.00 in cents
                vat_percentage: 6,
                order_items: [
                    {
                        quantity: 1,
                        order: {
                            status: OrderStatus.pending,
                            created_at: dayjs().toDate(),
                        },
                    },
                ],
            };

            const orderItems = [
                {
                    product_id: productId,
                    quantity: 2,
                },
            ];

            mockContext.prisma.product.findMany.mockResolvedValue([product] as any);
            const createdOrder = {
                id: orderId,
                total_amount: 10000,
                total_vat_amount: 600,
            } as any;
            mockContext.prisma.order.create.mockResolvedValue(createdOrder);

            await orderActions.createAndRedirectToOrder(orderItems);

            expect(mockContext.prisma.product.findMany).toHaveBeenCalledWith({
                where: { id: { in: [productId] } },
                select: {
                    id: true,
                    stock: true,
                    price: true,
                    vat_percentage: true,
                    order_items: {
                        select: {
                            quantity: true,
                            order: { select: { status: true, created_at: true } },
                        },
                    },
                },
            });

            expect(mockContext.prisma.order.create).toHaveBeenCalledWith({
                data: {
                    total_amount: 10000, // 2 * 5000
                    total_vat_amount: 600, // 2 * 300
                    user: {
                        connect: {
                            id: userId,
                        },
                    },
                    order_items: {
                        createMany: {
                            data: [
                                {
                                    product_id: productId,
                                    quantity: 2,
                                    price: 5000,
                                    vat_amount: 300, // 6% of 5000
                                },
                            ],
                        },
                    },
                },
                select: {
                    id: true,
                },
            });

            expect(vi.mocked(serverRedirect)).toHaveBeenCalledWith([GlobalConstants.ORDER], {
                [GlobalConstants.ORDER_ID]: orderId,
            });
        });

        it("creates order with multiple different products", async () => {
            const productId2 = "550e8400-e29b-41d4-a716-446655440005";
            const product1 = {
                id: productId,
                stock: 20,
                price: 5000,
                vat_percentage: 6,
                order_items: [
                    {
                        quantity: 2,
                        order: {
                            status: OrderStatus.pending,
                            created_at: dayjs().toDate(),
                        },
                    },
                ],
            };
            const product2 = {
                id: productId2,
                stock: 15,
                price: 3000,
                vat_percentage: 25,
                order_items: [
                    {
                        quantity: 1,
                        order: {
                            status: OrderStatus.pending,
                            created_at: dayjs().toDate(),
                        },
                    },
                ],
            };

            const orderItems = [
                {
                    product_id: productId,
                    quantity: 2,
                },
                {
                    product_id: productId2,
                    quantity: 3,
                },
            ];

            mockContext.prisma.product.findMany.mockResolvedValue([product1, product2] as any);
            mockContext.prisma.order.create.mockResolvedValue({
                id: orderId,
            } as any);

            await orderActions.createAndRedirectToOrder(orderItems);

            expect(mockContext.prisma.order.create).toHaveBeenCalledWith({
                data: {
                    total_amount: 19000, // (2 * 5000) + (3 * 3000)
                    total_vat_amount: 2850, // (2 * 300) + (3 * 750)
                    user: {
                        connect: {
                            id: userId,
                        },
                    },
                    order_items: {
                        createMany: {
                            data: [
                                {
                                    product_id: productId,
                                    quantity: 2,
                                    price: 5000,
                                    vat_amount: 300,
                                },
                                {
                                    product_id: productId2,
                                    quantity: 3,
                                    price: 3000,
                                    vat_amount: 750, // 25% of 3000
                                },
                            ],
                        },
                    },
                },
                select: {
                    id: true,
                },
            });
        });

        it("throws error when user is not logged in", async () => {
            vi.mocked(getLoggedInUser).mockResolvedValue(null);

            const orderItems = [
                {
                    product_id: productId,
                    quantity: 1,
                },
            ];

            await expect(orderActions.createAndRedirectToOrder(orderItems)).rejects.toThrow(
                "User must be logged in to create an order",
            );

            expect(mockContext.prisma.product.findMany).not.toHaveBeenCalled();
            expect(mockContext.prisma.order.create).not.toHaveBeenCalled();
        });

        it("does not decrement stock after order creation", async () => {
            // Stock should only be decremented when the order is shipped, not at creation
            const product = {
                id: productId,
                stock: 5,
                price: 1000,
                vat_percentage: 6,
                order_items: [
                    {
                        quantity: 1,
                        order: {
                            status: OrderStatus.pending,
                            created_at: dayjs().toDate(),
                        },
                    },
                ],
            };

            const orderItems = [
                {
                    product_id: productId,
                    quantity: 3,
                },
            ];

            mockContext.prisma.product.findMany.mockResolvedValue([product] as any);
            mockContext.prisma.order.create.mockResolvedValue({
                id: orderId,
            } as any);

            await orderActions.createAndRedirectToOrder(orderItems);

            // Stock should not be decremented at this stage
            expect(mockContext.prisma.product.update).not.toHaveBeenCalled();
        });

        it("calculates correct totals with different VAT rates", async () => {
            const product = {
                id: productId,
                stock: 10,
                price: 10000, // 100.00
                vat_percentage: 25, // 25%
                order_items: [
                    {
                        quantity: 1,
                        order: {
                            status: OrderStatus.pending,
                            created_at: dayjs().toDate(),
                        },
                    },
                ],
            };
            const orderItems = [
                {
                    product_id: productId,
                    quantity: 1,
                },
            ];

            mockContext.prisma.product.findMany.mockResolvedValue([product] as any);
            const createdOrder = {
                id: orderId,
            } as any;
            mockContext.prisma.order.create.mockResolvedValue(createdOrder);

            await orderActions.createAndRedirectToOrder(orderItems);

            expect(mockContext.prisma.order.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        total_amount: 10000,
                        total_vat_amount: 2500, // 25% of 10000
                    }),
                }),
            );
        });

        describe("cancelOrder", () => {
            it("allows order owner to cancel pending order", async () => {
                const order = {
                    id: orderId,
                    user_id: userId,
                    status: OrderStatus.pending,
                };

                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(order as any);
                mockContext.prisma.order.update.mockResolvedValue(order as any);

                await orderActions.cancelOrder(orderId);

                expect(mockContext.prisma.order.update).toHaveBeenCalledWith({
                    where: { id: orderId },
                    data: { status: OrderStatus.cancelled },
                });
                expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.ORDER, "max");
            });

            it("allows admin to cancel any pending order", async () => {
                const order = {
                    id: orderId,
                    user_id: userId, // Different from admin
                    status: OrderStatus.pending,
                };

                vi.mocked(getLoggedInUser).mockResolvedValue({
                    id: adminUserId,
                    role: UserRole.admin,
                } as any);

                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(order as any);
                mockContext.prisma.order.update.mockResolvedValue(order as any);

                await orderActions.cancelOrder(orderId);

                expect(mockContext.prisma.order.update).toHaveBeenCalledWith({
                    where: { id: orderId },
                    data: { status: OrderStatus.cancelled },
                });
            });

            it("throws error when user is not logged in", async () => {
                vi.mocked(getLoggedInUser).mockResolvedValue(null);

                const order = {
                    id: orderId,
                    user_id: userId,
                    status: OrderStatus.pending,
                };

                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(order as any);

                await expect(orderActions.cancelOrder(orderId)).rejects.toThrow(
                    "User must be logged in to cancel an order",
                );

                expect(mockContext.prisma.order.update).not.toHaveBeenCalled();
            });

            it("throws error when user is not order owner and not admin", async () => {
                const otherUserId = "550e8400-e29b-41d4-a716-446655440099";
                const order = {
                    id: orderId,
                    user_id: otherUserId, // Different user
                    status: OrderStatus.pending,
                };

                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(order as any);

                await expect(orderActions.cancelOrder(orderId)).rejects.toThrow(
                    "User does not have permission to cancel this order",
                );

                expect(mockContext.prisma.order.update).not.toHaveBeenCalled();
            });

            it("throws error when trying to cancel paid order", async () => {
                const order = {
                    id: orderId,
                    user_id: userId,
                    status: OrderStatus.paid,
                };

                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(order as any);

                await expect(orderActions.cancelOrder(orderId)).rejects.toThrow(
                    "Only pending orders can be cancelled",
                );

                expect(mockContext.prisma.order.update).not.toHaveBeenCalled();
            });

            it("throws error when trying to cancel shipped order", async () => {
                const order = {
                    id: orderId,
                    user_id: userId,
                    status: OrderStatus.shipped,
                };

                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(order as any);

                await expect(orderActions.cancelOrder(orderId)).rejects.toThrow(
                    "Only pending orders can be cancelled",
                );

                expect(mockContext.prisma.order.update).not.toHaveBeenCalled();
            });

            it("throws error when trying to cancel completed order", async () => {
                const order = {
                    id: orderId,
                    user_id: userId,
                    status: OrderStatus.completed,
                };

                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(order as any);

                await expect(orderActions.cancelOrder(orderId)).rejects.toThrow(
                    "Only pending orders can be cancelled",
                );

                expect(mockContext.prisma.order.update).not.toHaveBeenCalled();
            });

            it("throws error when trying to cancel already cancelled order", async () => {
                const order = {
                    id: orderId,
                    user_id: userId,
                    status: OrderStatus.cancelled,
                };

                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(order as any);

                await expect(orderActions.cancelOrder(orderId)).rejects.toThrow(
                    "Only pending orders can be cancelled",
                );

                expect(mockContext.prisma.order.update).not.toHaveBeenCalled();
            });

            it("throws error when order does not exist", async () => {
                mockContext.prisma.order.findUniqueOrThrow.mockRejectedValue(
                    new Error("Order not found"),
                );

                await expect(orderActions.cancelOrder(orderId)).rejects.toThrow("Order not found");

                expect(mockContext.prisma.order.update).not.toHaveBeenCalled();
            });
        });

        describe("deleteOrder", () => {
            it("allows admin to delete all orders", async () => {
                vi.mocked(getLoggedInUser).mockResolvedValue({
                    id: adminUserId,
                    role: UserRole.admin,
                } as any);
                const testOrder = {
                    id: orderId,
                    user_id: userId,
                } as any;
                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(testOrder);
                mockContext.prisma.order.delete.mockResolvedValue(testOrder);

                await orderActions.deleteOrder(orderId);

                expect(mockContext.prisma.order.delete).toHaveBeenCalled();
            });

            it("allows users to delete their own orders", async () => {
                vi.mocked(getLoggedInUser).mockResolvedValue({
                    id: userId,
                    role: UserRole.member,
                } as any);
                const testOrder = {
                    id: orderId,
                    user_id: userId,
                } as any;
                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(testOrder);
                mockContext.prisma.order.delete.mockResolvedValue(testOrder);

                await orderActions.deleteOrder(orderId);

                expect(mockContext.prisma.order.delete).toHaveBeenCalled();
            });

            it("prevents users from deleting others' orders", async () => {
                const otherUserId = "550e8400-e29b-41d4-a716-446655440099";
                vi.mocked(getLoggedInUser).mockResolvedValue({
                    id: otherUserId,
                    role: UserRole.member,
                } as any);
                const testOrder = {
                    id: orderId,
                    user_id: userId,
                } as any;
                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(testOrder);
                mockContext.prisma.order.delete.mockResolvedValue(testOrder);

                await expect(orderActions.deleteOrder(orderId)).rejects.toThrow(
                    "User does not have permission to delete this order",
                );

                expect(mockContext.prisma.order.delete).not.toHaveBeenCalled();
            });

            it("throws error when user is not logged in", async () => {
                vi.mocked(getLoggedInUser).mockResolvedValue(null);
                const testOrder = {
                    id: orderId,
                    user_id: userId,
                } as any;
                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(testOrder);
                mockContext.prisma.order.delete.mockResolvedValue(testOrder);

                await expect(orderActions.deleteOrder(orderId)).rejects.toThrow(
                    "User must be logged in to delete an order",
                );

                expect(mockContext.prisma.order.delete).not.toHaveBeenCalled();
            });

            it("throws error with invalid UUID format", async () => {
                const invalidId = "not-a-uuid";

                await expect(orderActions.deleteOrder(invalidId)).rejects.toThrow();

                expect(mockContext.prisma.order.delete).not.toHaveBeenCalled();
            });

            it("handles database errors during deletion", async () => {
                vi.mocked(getLoggedInUser).mockResolvedValue({
                    id: userId,
                    role: UserRole.member,
                } as any);
                const testOrder = {
                    id: orderId,
                    user_id: userId,
                } as any;
                mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue(testOrder);
                mockContext.prisma.order.delete.mockRejectedValue(new Error("Database error"));

                await expect(orderActions.deleteOrder(orderId)).rejects.toThrow("Database error");
            });
        });
    });
});
