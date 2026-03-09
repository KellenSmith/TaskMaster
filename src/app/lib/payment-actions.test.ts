import { describe, it, expect, vi } from "vitest";
import { redirectToOrderPayment, checkPaymentStatus } from "./payment-actions";
import { prisma } from "../../prisma/prisma-client";
import { progressOrder } from "./order-helpers";
import { isOrderpaid, redirectToSwedbankPayment, isSwedbankPayConfigured } from "./payment-helpers";
import { getLoggedInUser, getUserLanguage } from "./user-helpers";
import { isUserAdmin } from "./utils";
import { revalidateTag } from "next/cache";
import { Language, OrderStatus } from "../../prisma/generated/enums";

vi.mock("./order-helpers", () => ({
    progressOrder: vi.fn(),
}));
vi.mock("./payment-helpers", () => ({
    isOrderpaid: vi.fn(),
    redirectToSwedbankPayment: vi.fn(),
    isSwedbankPayConfigured: vi.fn(),
}));
vi.mock("./user-helpers", () => ({
    getLoggedInUser: vi.fn(),
    getUserLanguage: vi.fn(),
}));
vi.mock("./utils", () => ({
    isUserAdmin: vi.fn(),
}));

const userId = "550e8400-e29b-41d4-a716-446655440001";
const otherUserId = "550e8400-e29b-41d4-a716-446655440002";

const orderId = "550e8400-e29b-41d4-a716-446655440003";

const baseOrder = {
    id: orderId,
    user_id: userId,
    status: OrderStatus.pending,
    total_amount: 100,
    payment_request_id: "pay-req-id",
    user: {},
    order_items: [],
};

describe("redirectToOrderPayment", () => {
    it("throws if user is not logged in", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue(null);
        vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue(baseOrder as any);

        const result = await redirectToOrderPayment(baseOrder.id);

        expect(result).toBe("Unauthorized");
    });

    it("throws if user does not own the order", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: otherUserId } as any);
        vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue(baseOrder as any);

        const result = await redirectToOrderPayment(baseOrder.id);

        expect(result).toBe("Unauthorized");
    });

    it("throws if order is not pending", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: baseOrder.user_id } as any);
        vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
            ...baseOrder,
            status: OrderStatus.completed,
        } as any);

        const result = await redirectToOrderPayment(baseOrder.id);

        expect(result).toBe("Only pending orders can be paid for");
    });

    it("calls progressOrder for free order", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: baseOrder.user_id } as any);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
            ...baseOrder,
            total_amount: 0,
        } as any);
        await redirectToOrderPayment(baseOrder.id);
        expect(progressOrder).toHaveBeenCalledWith(expect.anything(), false);
        expect(redirectToSwedbankPayment).not.toHaveBeenCalled();
        expect(revalidateTag).toHaveBeenCalledTimes(1);
    });

    it("calls redirectToSwedbankPayment for paid order", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: baseOrder.user_id } as any);
        vi.mocked(isSwedbankPayConfigured).mockReturnValue(true);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({ ...baseOrder } as any);
        await redirectToOrderPayment(baseOrder.id);
        expect(redirectToSwedbankPayment).toHaveBeenCalledWith(
            expect.objectContaining({ id: baseOrder.id }),
        );
    });

    it("returns error if trying to pay a paid order when Swedbank Pay is not configured", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: baseOrder.user_id } as any);
        vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
        vi.mocked(isSwedbankPayConfigured).mockReturnValue(false);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({ ...baseOrder } as any);

        const result = await redirectToOrderPayment(baseOrder.id);

        expect(result).toBe("Swedbank Pay is not configured");
        expect(redirectToSwedbankPayment).not.toHaveBeenCalled();
    });
});

describe("checkPaymentStatus", () => {
    it("throws if not admin and not order owner", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: otherUserId } as any);
        vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({ ...baseOrder } as any);

        const result = await checkPaymentStatus(otherUserId, baseOrder.id);

        expect(result).toBe("Unauthorized");
    });

    it("returns for cancelled or completed orders", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: baseOrder.user_id } as any);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
            ...baseOrder,
            status: OrderStatus.cancelled,
        } as any);
        await expect(checkPaymentStatus(baseOrder.user_id, baseOrder.id)).resolves.toBeUndefined();
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
            ...baseOrder,
            status: OrderStatus.completed,
        } as any);
        await expect(checkPaymentStatus(baseOrder.user_id, baseOrder.id)).resolves.toBeUndefined();
    });

    it("calls progressOrder for free order", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: baseOrder.user_id } as any);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
            ...baseOrder,
            total_amount: 0,
        } as any);
        await checkPaymentStatus(baseOrder.user_id, baseOrder.id);
        expect(progressOrder).toHaveBeenCalledWith(
            expect.objectContaining({ id: baseOrder.id }),
            false,
        );
    });

    it("throws if non-pending order has no payment_request_id", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: baseOrder.user_id } as any);
        vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
        vi.mocked(isSwedbankPayConfigured).mockReturnValue(true);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
            ...baseOrder,
            payment_request_id: null,
            status: OrderStatus.paid,
        } as any);
        const result = await checkPaymentStatus(baseOrder.user_id, baseOrder.id);
        expect(result).toBe("No payment initiated for non-pending order");
    });

    it("returns if pending order has no payment_request_id", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: baseOrder.user_id } as any);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({
            ...baseOrder,
            payment_request_id: null,
            status: OrderStatus.pending,
        } as any);
        await expect(checkPaymentStatus(baseOrder.user_id, baseOrder.id)).resolves.toBeUndefined();
    });

    it("calls progressOrder if isPaid", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: baseOrder.user_id } as any);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(isSwedbankPayConfigured).mockReturnValue(true);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({ ...baseOrder } as any);
        vi.mocked(isOrderpaid).mockResolvedValue({ isPaid: true, needsCapture: true });
        await checkPaymentStatus(baseOrder.user_id, baseOrder.id);
        expect(progressOrder).toHaveBeenCalledWith(expect.anything(), true);
    });

    it("does not call progressOrder if not paid", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: baseOrder.user_id } as any);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(isSwedbankPayConfigured).mockReturnValue(true);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({ ...baseOrder } as any);
        vi.mocked(isOrderpaid).mockResolvedValue({ isPaid: false, needsCapture: false });

        await checkPaymentStatus(baseOrder.user_id, baseOrder.id);

        expect(progressOrder).not.toHaveBeenCalled();
    });

    it("returns error if checking paid order status when Swedbank Pay is not configured", async () => {
        vi.mocked(getLoggedInUser).mockResolvedValue({ id: baseOrder.user_id } as any);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(isSwedbankPayConfigured).mockReturnValue(false);
        vi.mocked(getUserLanguage).mockResolvedValue(Language.english);
        vi.mocked(prisma.order.findUniqueOrThrow).mockResolvedValue({ ...baseOrder } as any);

        const result = await checkPaymentStatus(baseOrder.user_id, baseOrder.id);

        expect(result).toBe("Swedbank Pay is not configured");
        expect(isOrderpaid).not.toHaveBeenCalled();
    });
});
