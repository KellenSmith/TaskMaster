import { mockContext } from "../../test/mocks/prismaMock";
import { TransactionClient } from "../../test/types/test-types";
import { addEventParticipantWithTx } from "./event-participant-actions";
import { sendMail } from "./mail-service/mail-service";
import * as productHelpers from "./product-helpers";
import { renewUserMembership } from "./user-membership-actions";

vi.mock("./user-membership-actions", () => ({
    renewUserMembership: vi.fn(),
}));

vi.mock("./event-participant-actions", () => ({
    addEventParticipantWithTx: vi.fn(),
}));

vi.mock("./mail-service/mail-service", () => ({
    sendMail: vi.fn(),
}));

const productId = "550e8400-e29b-41d4-a716-446655440000";
const userId = "550e8400-e29b-41d4-a716-446655440001";

describe("product-helpers", () => {
    describe("processOrderedProduct", () => {
        it("renews membership when product is membership", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const orderItem = {
                order_id: "order-1",
                quantity: 1,
                product: {
                    name: "Annual Membership",
                    stock: null,
                    membership: { product_id: productId },
                    ticket: null,
                },
            } as any;

            await productHelpers.processOrderedProduct(tx as any, userId, orderItem);

            expect(vi.mocked(renewUserMembership)).toHaveBeenCalledWith(tx, userId, productId);
        });

        it("adds event participant when product is ticket", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const orderItem = {
                order_id: "order-1",
                quantity: 2,
                product: {
                    name: "Event Ticket",
                    stock: 10,
                    membership: null,
                    ticket: { product_id: productId },
                },
            } as any;

            await productHelpers.processOrderedProduct(tx as any, userId, orderItem);

            expect(vi.mocked(addEventParticipantWithTx)).toHaveBeenCalledTimes(2);
            expect(vi.mocked(addEventParticipantWithTx)).toHaveBeenCalledWith(
                tx,
                productId,
                userId,
            );
        });

        it("sends email notification for generic product", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const orderItem = {
                order_id: "order-1",
                quantity: 1,
                product: {
                    name: "T-Shirt",
                    stock: 50,
                    membership: null,
                    ticket: null,
                },
            } as any;

            await productHelpers.processOrderedProduct(tx as any, userId, orderItem);

            expect(vi.mocked(sendMail)).toHaveBeenCalledWith(
                [process.env.EMAIL],
                "Product purchased: T-Shirt",
                expect.anything(),
            );
        });

        it("throws error when insufficient stock", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const orderItem = {
                order_id: "order-1",
                quantity: 10,
                product: {
                    name: "T-Shirt",
                    stock: 5,
                    membership: null,
                    ticket: null,
                },
            } as any;

            await expect(
                productHelpers.processOrderedProduct(tx as any, userId, orderItem),
            ).rejects.toThrow("Insufficient stock for: T-Shirt");
        });

        it("processes multiple quantities correctly", async () => {
            const tx = mockContext.prisma as any as TransactionClient;
            const orderItem = {
                order_id: "order-1",
                quantity: 3,
                product: {
                    name: "Ticket",
                    stock: 10,
                    membership: null,
                    ticket: { product_id: productId },
                },
            } as any;

            await productHelpers.processOrderedProduct(tx as any, userId, orderItem);

            expect(vi.mocked(addEventParticipantWithTx)).toHaveBeenCalledTimes(3);
        });
    });

    describe("getAvailableProductStock", () => {
        it("returns null for unlimited stock", async () => {
            const product = {
                stock: null,
                order_items: [],
            };
            expect(await productHelpers.getAvailableProductStock(product as any)).toBeNull();
        });

        it("returns correct available stock when some is reserved", async () => {
            const now = new Date();
            const product = {
                stock: 10,
                order_items: [
                    {
                        quantity: 3,
                        order: {
                            status: "pending",
                            created_at: now,
                        },
                    },
                    {
                        quantity: 2,
                        order: {
                            status: "paid",
                            created_at: now,
                        },
                    },
                ],
            };
            // Only the pending order counts as reserved
            expect(await productHelpers.getAvailableProductStock(product as any)).toBe(7);
        });

        it("returns 0 if reserved stock >= total stock", async () => {
            const now = new Date();
            const product = {
                stock: 5,
                order_items: [
                    {
                        quantity: 3,
                        order: {
                            status: "pending",
                            created_at: now,
                        },
                    },
                    {
                        quantity: 2,
                        order: {
                            status: "pending",
                            created_at: now,
                        },
                    },
                ],
            };
            expect(await productHelpers.getAvailableProductStock(product as any)).toBe(0);
        });

        it("ignores expired pending orders for reservation", async () => {
            const now = new Date();
            const oldDate = new Date(Date.now() - 31 * 60 * 1000); // 31 minutes ago
            const product = {
                stock: 10,
                order_items: [
                    {
                        quantity: 4,
                        order: {
                            status: "pending",
                            created_at: oldDate,
                        },
                    },
                    {
                        quantity: 2,
                        order: {
                            status: "pending",
                            created_at: now,
                        },
                    },
                ],
            };
            // Only the recent pending order counts
            expect(await productHelpers.getAvailableProductStock(product as any)).toBe(8);
        });
    });
});
