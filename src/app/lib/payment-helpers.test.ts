import { describe, it, expect, vi } from "vitest";
import { prisma } from "../../prisma/prisma-client";
import { redirect } from "next/navigation";
import { PaymentState, TransactionType } from "./payment-types";
import { Language } from "../../prisma/generated/enums";

vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
}));
vi.mock("next/headers", () => ({
    headers: () => ({
        get: vi.fn().mockReturnValue("test-agent"),
    }),
}));
vi.mock("./organization-settings-helpers", () => ({
    getOrganizationSettings: vi
        .fn()
        .mockResolvedValue({ logo_url: "logo", terms_of_purchase_english_url: "terms" }),
}));
vi.mock("./user-helpers", () => ({ getUserLanguage: vi.fn().mockResolvedValue(Language.english) }));

import { redirectToSwedbankPayment, isOrderpaid, capturePaymentFunds } from "./payment-helpers";
import { getUserLanguage } from "./user-helpers";
import { getOrganizationSettings } from "./organization-settings-helpers";

const baseOrder = {
    id: "order-uuid",
    user_id: "user-uuid",
    status: "pending",
    total_amount: 100,
    total_vat_amount: 25,
    payment_request_id: "pay-req-id",
    payee_ref: "payee-ref",
    order_items: [
        {
            product: { id: "prod1", name: "Product 1", price: 100, vat_percentage: 25 },
            quantity: 1,
            price: 100,
            vat_amount: 25,
        },
    ],
};

global.fetch = vi.fn();

describe("redirectToSwedbankPayment", () => {
    it("throws if Swedbank API fails", async () => {
        (global.fetch as any).mockResolvedValue({ ok: false, text: async () => "fail" });

        await expect(redirectToSwedbankPayment(baseOrder as any)).rejects.toThrow(
            "Swedbank Pay request failed",
        );
    });
    it("throws if redirect URL missing", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ operations: [], paymentOrder: { id: "id" } }),
        });

        await expect(redirectToSwedbankPayment(baseOrder as any)).rejects.toThrow(
            "Redirect URL not found",
        );
    });
    it("updates order and redirects on success", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                operations: [{ rel: "redirect-checkout", href: "https://redirect" }],
                paymentOrder: { id: "poid" },
            }),
        });
        (prisma.order.update as any).mockResolvedValue({});

        await redirectToSwedbankPayment(baseOrder as any);
        expect(prisma.order.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: baseOrder.id },
                data: { payment_request_id: "poid" },
            }),
        );

        expect(redirect).toHaveBeenCalledWith("https://redirect");
    });
});

describe("isOrderpaid", () => {
    it("throws if payment status fetch fails", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "fail",
            text: async () => "fail",
        });

        await expect(
            isOrderpaid({
                id: baseOrder.id,
                payment_request_id: baseOrder.payment_request_id,
            } as any),
        ).rejects.toThrow("Failed to check payment status");
    });
    it("returns isPaid and needsCapture correctly", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                paymentOrder: {
                    status: PaymentState.Paid,
                    paid: { transactionType: TransactionType.Authorization },
                },
            }),
        });

        const result = await isOrderpaid({
            id: baseOrder.id,
            payment_request_id: baseOrder.payment_request_id,
        } as any);

        expect(result).toEqual({ isPaid: true, needsCapture: true });
    });
    it("returns isPaid false if not paid", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ paymentOrder: { status: "NotPaid" } }),
        });

        const result = await isOrderpaid({
            id: baseOrder.id,
            payment_request_id: baseOrder.payment_request_id,
        } as any);

        expect(result).toEqual({ isPaid: false, needsCapture: false });
    });
});

describe("capturePaymentFunds", () => {
    it("throws if payee_ref missing", async () => {
        await expect(
            capturePaymentFunds({ ...baseOrder, payee_ref: undefined } as any),
        ).rejects.toThrow("missing payeeRef");
    });

    it("throws if capture fails", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 400,
            statusText: "fail",
            text: async () => "fail",
        });

        await expect(capturePaymentFunds(baseOrder as any)).rejects.toThrow(
            "Payment capture failed",
        );
    });

    it("succeeds if capture ok", async () => {
        (global.fetch as any).mockResolvedValue({ ok: true });

        await expect(capturePaymentFunds(baseOrder as any)).resolves.toBeUndefined();
    });
});

describe("redirectToSwedbankPayment (payload edge cases)", () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it("uses Swedish termsOfServiceUrl fallback if swedish url missing", async () => {
        vi.mocked(prisma.order.findFirst).mockResolvedValueOnce(undefined as any);
        vi.mocked(getUserLanguage).mockResolvedValueOnce(Language.swedish);
        vi.mocked(getOrganizationSettings).mockResolvedValueOnce({
            logo_url: "logo",
            terms_of_purchase_english_url: "terms-en",
            terms_of_purchase_swedish_url: null,
        } as any);
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                operations: [{ rel: "redirect-checkout", href: "https://redirect" }],
                paymentOrder: { id: "poid" },
            }),
        });
        (prisma.order.update as any).mockResolvedValue({});
        await redirectToSwedbankPayment({ ...baseOrder, order_items: [] } as any);
        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.paymentorder.urls.termsOfServiceUrl).toBe("terms-en");
    });

    it("orderItem class/description: membership", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                operations: [{ rel: "redirect-checkout", href: "https://redirect" }],
                paymentOrder: { id: "poid" },
            }),
        });
        (prisma.order.update as any).mockResolvedValue({});
        const order = {
            ...baseOrder,
            order_items: [
                {
                    product: {
                        id: "id1",
                        name: "n",
                        price: 1,
                        vat_percentage: 1,
                        membership: true,
                    },
                    quantity: 1,
                    price: 1,
                    vat_amount: 1,
                },
            ],
        };
        await redirectToSwedbankPayment(order as any);
        const fetchCall = (global.fetch as any).mock.calls[0];
        const item = JSON.parse(fetchCall[1].body).paymentorder.orderItems[0];
        expect(item.class).toBe("Membership");
        expect(item.description).toBe("Membership");
    });
    it("orderItem class/description: ticket", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                operations: [{ rel: "redirect-checkout", href: "https://redirect" }],
                paymentOrder: { id: "poid" },
            }),
        });
        (prisma.order.update as any).mockResolvedValue({});
        const order = {
            ...baseOrder,
            order_items: [
                {
                    product: { id: "id2", name: "n", price: 1, vat_percentage: 1, ticket: true },
                    quantity: 1,
                    price: 1,
                    vat_amount: 1,
                },
            ],
        };
        await redirectToSwedbankPayment(order as any);
        const fetchCall = (global.fetch as any).mock.calls[0];
        const item = JSON.parse(fetchCall[1].body).paymentorder.orderItems[0];
        expect(item.class).toBe("Ticket");
        expect(item.description).toBe("Ticket");
    });
    it("orderItem class/description: product fallback", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                operations: [{ rel: "redirect-checkout", href: "https://redirect" }],
                paymentOrder: { id: "poid" },
            }),
        });
        (prisma.order.update as any).mockResolvedValue({});
        const order = {
            ...baseOrder,
            order_items: [
                {
                    product: { id: "id3", name: "n", price: 1, vat_percentage: 1 },
                    quantity: 1,
                    price: 1,
                    vat_amount: 1,
                },
            ],
        };
        await redirectToSwedbankPayment(order as any);
        const fetchCall = (global.fetch as any).mock.calls[0];
        const item = JSON.parse(fetchCall[1].body).paymentorder.orderItems[0];
        expect(item.class).toBe("Product");
        expect(item.description).toBe("Product");
    });
    it("orderItem description: uses product.description if present", async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({
                operations: [{ rel: "redirect-checkout", href: "https://redirect" }],
                paymentOrder: { id: "poid" },
            }),
        });
        (prisma.order.update as any).mockResolvedValue({});
        const order = {
            ...baseOrder,
            order_items: [
                {
                    product: {
                        id: "id4",
                        name: "n",
                        price: 1,
                        vat_percentage: 1,
                        description: "desc",
                    },
                    quantity: 1,
                    price: 1,
                    vat_amount: 1,
                },
            ],
        };
        await redirectToSwedbankPayment(order as any);
        const fetchCall = (global.fetch as any).mock.calls[0];
        const item = JSON.parse(fetchCall[1].body).paymentorder.orderItems[0];
        expect(item.description).toBe("desc");
    });
});
