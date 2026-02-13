import { describe, it, expect, vi, beforeEach } from "vitest";
import * as orderHelpers from "./order-helpers";
import { OrderStatus, UserRole, UserStatus } from "../../prisma/generated/enums";
import GlobalConstants from "../GlobalConstants";
import { revalidateTag } from "next/cache";
import { processOrderItems } from "./order-item-helpers";
import { sendOrderConfirmation } from "./mail-service/mail-service";
import { capturePaymentFunds } from "./payment-helpers";
import { prisma } from "../../prisma/prisma-client";

vi.mock("../GlobalConstants", () => ({
    default: { ORDER: "ORDER" },
}));
vi.mock("next/cache", () => ({
    revalidateTag: vi.fn(),
}));
vi.mock("./mail-service/mail-service", () => ({
    sendOrderConfirmation: vi.fn(),
}));
vi.mock("./payment-helpers", () => ({
    capturePaymentFunds: vi.fn(),
}));
vi.mock("./order-item-helpers", () => ({
    processOrderItems: vi.fn(),
}));

const baseUser = {
    id: "user-1",
    status: UserStatus.validated,
    role: UserRole.member,
    email: "user1@example.com",
    emailVerified: null,
    nickname: "user1",
    first_name: "User",
    sur_name: "One",
    pronoun: null,
    phone: null,
    consent_to_newsletters: false,
    created_at: new Date(),
};
const baseOrder = {
    id: "order-1",
    status: OrderStatus.pending,
    total_amount: 100,
    total_vat_amount: 25,
    payment_request_id: null,
    payee_ref: null,
    created_at: new Date(),
    updated_at: new Date(),
    user_id: baseUser.id,
    user: baseUser,
    order_items: [
        {
            order_id: "order-1",
            quantity: 2,
            vat_amount: 25,
            price: 100,
            product_id: "prod-1",
            product: {
                id: "prod-1",
                membership: null,
                ticket: null,
                stock: 10,
                price: 100,
                vat_percentage: 25,
                order_items: [],
                name: "Test Product",
                description: null,
                image_url: null,
            },
        },
    ],
};

describe("order-helpers", () => {
    describe("progressOrder", () => {
        it("progresses pending order", async () => {
            vi.mocked(prisma.order.update)
                .mockResolvedValueOnce({
                    ...baseOrder,
                    status: OrderStatus.paid,
                })
                .mockResolvedValueOnce({
                    ...baseOrder,
                    status: OrderStatus.shipped,
                });

            await orderHelpers.progressOrder({ ...baseOrder }, true);

            expect(vi.mocked(processOrderItems)).toHaveBeenCalled();
            expect(vi.mocked(sendOrderConfirmation)).toHaveBeenCalled();
            expect(vi.mocked(capturePaymentFunds)).toHaveBeenCalledWith(
                expect.objectContaining({ id: baseOrder.id }),
            );

            expect(prisma.order.update).toHaveBeenCalledTimes(3);
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: baseOrder.id },
                    data: expect.objectContaining({
                        status: OrderStatus.paid,
                    }),
                }),
            );
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: baseOrder.id },
                    data: expect.objectContaining({
                        status: OrderStatus.shipped,
                    }),
                }),
            );
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: baseOrder.id },
                    data: expect.objectContaining({
                        status: OrderStatus.completed,
                    }),
                }),
            );
            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.ORDER, "max");
        });

        it("progresses paid order", async () => {
            vi.mocked(prisma.order.update).mockResolvedValueOnce({
                ...baseOrder,
                status: OrderStatus.shipped,
            });

            await orderHelpers.progressOrder({ ...baseOrder, status: OrderStatus.paid }, true);

            expect(vi.mocked(processOrderItems)).toHaveBeenCalled();
            expect(vi.mocked(sendOrderConfirmation)).toHaveBeenCalled();
            expect(vi.mocked(capturePaymentFunds)).toHaveBeenCalledWith(
                expect.objectContaining({ id: baseOrder.id }),
            );

            expect(prisma.order.update).toHaveBeenCalledTimes(2);
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: baseOrder.id },
                    data: expect.objectContaining({
                        status: OrderStatus.shipped,
                    }),
                }),
            );
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: baseOrder.id },
                    data: expect.objectContaining({
                        status: OrderStatus.completed,
                    }),
                }),
            );

            expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.ORDER, "max");
        });

        it("progresses shipped order", async () => {
            await orderHelpers.progressOrder({ ...baseOrder, status: OrderStatus.shipped }, true);

            expect(vi.mocked(processOrderItems)).not.toHaveBeenCalled();
            expect(vi.mocked(sendOrderConfirmation)).not.toHaveBeenCalled();
            expect(vi.mocked(capturePaymentFunds)).toHaveBeenCalledWith(
                expect.objectContaining({ id: baseOrder.id }),
            );

            expect(prisma.order.update).toHaveBeenCalledTimes(1);
            expect(prisma.order.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: baseOrder.id },
                    data: expect.objectContaining({
                        status: OrderStatus.completed,
                    }),
                }),
            );
        });

        it("logs error if sendOrderConfirmation fails but still progresses", async () => {
            vi.mocked(prisma.order.update)
                .mockResolvedValueOnce({
                    ...baseOrder,
                    status: OrderStatus.paid,
                })
                .mockResolvedValueOnce({
                    ...baseOrder,
                    status: OrderStatus.shipped,
                });
            vi.mocked(sendOrderConfirmation).mockImplementation(() => {
                throw new Error("fail");
            });
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            await orderHelpers.progressOrder(baseOrder, true);

            expect(consoleSpy).toHaveBeenCalledWith(
                "Failed to send order confirmation:",
                expect.any(Error),
            );
        });

        it("does not call capturePaymentFunds if not needed", async () => {
            await orderHelpers.progressOrder({ ...baseOrder, status: OrderStatus.shipped }, false);

            expect(vi.mocked(capturePaymentFunds)).not.toHaveBeenCalled();
            expect(vi.mocked(prisma.order.update)).toHaveBeenCalledWith({
                where: { id: baseOrder.id },
                data: { status: OrderStatus.completed },
            });
        });
    });
});
