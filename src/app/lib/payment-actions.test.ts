import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockContext } from "../../test/mocks/prismaMock";
import {
    redirectToSwedbankPayment,
    checkPaymentStatus,
    capturePaymentFunds,
} from "./payment-actions";
import { defaultFormActionState } from "./definitions";
import testdata from "../../test/testdata";
import { PaymentOrderResponse, PaymentState } from "./payment-utils";
import { Order } from "@prisma/client";

// Mock Next.js headers
vi.mock("next/headers", () => ({
    headers: vi.fn(() => Promise.resolve(new Map([["user-agent", "Mozilla/5.0 (Test Browser)"]]))),
}));

// Mock order-actions module
vi.mock("./order-actions", () => ({
    getOrderById: vi.fn(),
    updateOrderStatus: vi.fn(),
}));

// Import the mocked functions after the mock is set up
import { getOrderById, updateOrderStatus } from "./order-actions";
const mockGetOrderById = vi.mocked(getOrderById);
const mockUpdateOrderStatus = vi.mocked(updateOrderStatus);

// Mock environment variables
const mockEnv = {
    SWEDBANK_PAY_ACCESS_TOKEN: "test-access-token",
    SWEDBANK_PAY_PAYEE_ID: "test-payee-id",
    VERCEL_URL: "https://test-domain.com",
    NEXT_PUBLIC_ORG_NAME: "Test Organization",
};

vi.stubEnv("SWEDBANK_PAY_ACCESS_TOKEN", mockEnv.SWEDBANK_PAY_ACCESS_TOKEN);
vi.stubEnv("SWEDBANK_PAY_PAYEE_ID", mockEnv.SWEDBANK_PAY_PAYEE_ID);
vi.stubEnv("VERCEL_URL", mockEnv.VERCEL_URL);
vi.stubEnv("NEXT_PUBLIC_ORG_NAME", mockEnv.NEXT_PUBLIC_ORG_NAME);

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Date.now for consistent payeeReference generation
const mockDateNow = vi.spyOn(Date, "now");
const mockMathRandom = vi.spyOn(Math, "random");

beforeEach(() => {
    vi.resetAllMocks();
    mockDateNow.mockReturnValue(1672531200000); // Fixed timestamp: 2023-01-01T00:00:00.000Z
    mockMathRandom.mockReturnValue(0); // Fixed random value to ensure deterministic output
});

describe("Payment Actions", () => {
    describe("getPaymentRedirectUrl", () => {
        const mockOrder = {
            ...testdata.order,
            paymentRequestId: null,
        };

        const mockPaymentResponse = {
            paymentOrder: {
                id: "/psp/paymentorders/payment-order-id-123",
                status: "Ready",
            },
            operations: [
                {
                    method: "GET",
                    href: "https://ecom.externalintegration.payex.com/checkout/checkout-url-123",
                    rel: "redirect-checkout",
                    contentType: "text/html",
                },
            ],
        };

        beforeEach(() => {
            mockGetOrderById.mockResolvedValue({
                status: 200,
                result: [mockOrder],
                errorMsg: "",
            });
        });

        it("should successfully create payment request and return redirect URL", async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockPaymentResponse),
            });

            mockContext.prisma.order.update.mockResolvedValue({
                ...mockOrder,
                paymentRequestId: mockPaymentResponse.paymentOrder.id,
            });

            const result = await redirectToSwedbankPayment(defaultFormActionState, mockOrder.id);

            expect(result.status).toBe(200);
            expect(result.result).toBe(mockPaymentResponse.operations[0].href);
            expect(result.errorMsg).toBe("");

            // Verify fetch was called with correct parameters
            expect(mockFetch).toHaveBeenCalledWith(
                "https://api.externalintegration.payex.com/psp/paymentorders",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json;version=3.1",
                        Authorization: `Bearer ${mockEnv.SWEDBANK_PAY_ACCESS_TOKEN}`,
                    },
                    body: JSON.stringify({
                        paymentorder: {
                            operation: "Purchase",
                            currency: "SEK",
                            amount: mockOrder.totalAmount * 100,
                            vatAmount: 0,
                            description: "Purchase",
                            userAgent: "Mozilla/5.0 (Test Browser)",
                            language: "en-US",
                            urls: {
                                hostUrls: [mockEnv.VERCEL_URL],
                                completeUrl: `${mockEnv.VERCEL_URL}/order/complete?orderId=${mockOrder.id}`,
                                cancelUrl: `${mockEnv.VERCEL_URL}/order/complete?orderId=${mockOrder.id}`,
                                callbackUrl: `${mockEnv.VERCEL_URL}/api/payment-callback?orderId=${mockOrder.id}`,
                            },
                            payeeInfo: {
                                payeeId: mockEnv.SWEDBANK_PAY_PAYEE_ID,
                                payeeReference: "PAYorder123456782531200000",
                                payeeName: mockEnv.NEXT_PUBLIC_ORG_NAME,
                                orderReference: mockOrder.id,
                            },
                        },
                    }),
                },
            ); // Verify prisma order update was called
            expect(mockContext.prisma.order.update).toHaveBeenCalledWith({
                where: { id: mockOrder.id },
                data: {
                    paymentRequestId: mockPaymentResponse.paymentOrder.id,
                },
            });
        });

        it("should handle order not found error", async () => {
            mockGetOrderById.mockResolvedValue({
                status: 404,
                result: [],
                errorMsg: "Order not found",
            });

            const result = await redirectToSwedbankPayment(
                defaultFormActionState,
                "non-existent-order",
            );

            expect(result.status).toBe(500);
            expect(result.result).toBe("");
            expect(result.errorMsg).toBe("Order not found");
        });

        it("should handle payment request creation failure", async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
            });

            const result = await redirectToSwedbankPayment(defaultFormActionState, mockOrder.id);

            expect(result.status).toBe(500);
            expect(result.result).toBe("");
            expect(result.errorMsg).toBe("Failed to create payment request");
        });
        it("should handle missing redirect operation in response", async () => {
            const responseWithoutRedirect = {
                ...mockPaymentResponse,
                operations: [
                    {
                        method: "GET",
                        href: "https://example.com/other-operation",
                        rel: "view-checkout",
                        contentType: "application/json",
                    },
                ],
            };

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(responseWithoutRedirect),
            });

            const result = await redirectToSwedbankPayment(defaultFormActionState, mockOrder.id);

            expect(result.status).toBe(500);
            expect(result.result).toBe("");
            expect(result.errorMsg).toBe("Redirect URL not found in payment response");
        });

        it("should handle database update failure", async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockPaymentResponse),
            });

            mockContext.prisma.order.update.mockRejectedValue(
                new Error("Database connection failed"),
            );

            const result = await redirectToSwedbankPayment(defaultFormActionState, mockOrder.id);

            expect(result.status).toBe(500);
            expect(result.result).toBe("");
            expect(result.errorMsg).toMatch(
                /Failed to update order with payee reference PAY[a-zA-Z0-9]{23}: Database connection failed/,
            );
        });

        it("should generate unique payeeReference for different orders", async () => {
            const order1 = { ...mockOrder, id: "order-1111-2222" };
            const order2 = { ...mockOrder, id: "order-3333-4444" };

            mockGetOrderById
                .mockResolvedValueOnce({
                    status: 200,
                    result: [order1],
                    errorMsg: "",
                })
                .mockResolvedValueOnce({
                    status: 200,
                    result: [order2],
                    errorMsg: "",
                });

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockPaymentResponse),
            });

            mockContext.prisma.order.update.mockResolvedValue({});

            await redirectToSwedbankPayment(defaultFormActionState, order1.id);
            await redirectToSwedbankPayment(defaultFormActionState, order2.id);

            const calls = mockFetch.mock.calls;
            const body1 = JSON.parse(calls[0][1].body);
            const body2 = JSON.parse(calls[1][1].body);
            expect(body1.paymentorder.payeeInfo.payeeReference).toBe("PAYorder111122222531200000");
            expect(body2.paymentorder.payeeInfo.payeeReference).toBe("PAYorder333344442531200000");
            expect(body1.paymentorder.payeeInfo.payeeReference).not.toBe(
                body2.paymentorder.payeeInfo.payeeReference,
            );
        });
    });

    describe("checkPaymentStatus", () => {
        const mockOrderWithPaymentId = {
            ...testdata.order,
            paymentRequestId: "/psp/paymentorders/payment-order-id-123",
        };

        const mockPaymentStatusResponse = {
            paymentOrder: {
                id: "/psp/paymentorders/payment-order-id-123",
                status: PaymentState.Paid,
                paid: {
                    transactionType: "Authorization",
                },
            },
        };

        beforeEach(() => {
            mockGetOrderById.mockResolvedValue({
                status: 200,
                result: [mockOrderWithPaymentId],
                errorMsg: "",
            });

            mockUpdateOrderStatus.mockResolvedValue({
                status: 200,
                result: "Order updated successfully",
                errorMsg: "",
            });
        });

        it("should successfully check payment status and update order", async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockPaymentStatusResponse),
            });

            const result = await checkPaymentStatus(
                mockOrderWithPaymentId.id,
                defaultFormActionState,
            );

            expect(result.status).toBe(200);
            expect(result.result).toBe("Order updated successfully");

            // Verify fetch was called with correct URL and headers
            expect(mockFetch).toHaveBeenCalledWith(
                `https://api.externalintegration.payex.com${mockOrderWithPaymentId.paymentRequestId}?$expand=paid`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json;version=3.1",
                        Authorization: `Bearer ${mockEnv.SWEDBANK_PAY_ACCESS_TOKEN}`,
                    },
                },
            );

            // Verify updateOrderStatus was called with correct parameters
            expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
                mockOrderWithPaymentId.id,
                defaultFormActionState,
                "paid",
            );
        });

        it("should handle order not found", async () => {
            mockGetOrderById.mockResolvedValue({
                status: 404,
                result: [],
                errorMsg: "Order not found",
            });

            const result = await checkPaymentStatus("non-existent-order", defaultFormActionState);

            expect(result.status).toBe(400);
            expect(result.result).toBe("");
            expect(result.errorMsg).toBe("Payment request ID not found for this order");
        });

        it("should handle missing payment request ID", async () => {
            const orderWithoutPaymentId = {
                ...testdata.order,
                paymentRequestId: null,
            };

            mockGetOrderById.mockResolvedValue({
                status: 200,
                result: [orderWithoutPaymentId],
                errorMsg: "",
            });

            const result = await checkPaymentStatus(
                orderWithoutPaymentId.id,
                defaultFormActionState,
            );

            expect(result.status).toBe(400);
            expect(result.result).toBe("");
            expect(result.errorMsg).toBe("Payment request ID not found for this order");
        });

        it("should handle payment status API failure", async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
            });

            const result = await checkPaymentStatus(
                mockOrderWithPaymentId.id,
                defaultFormActionState,
            );

            expect(result.status).toBe(500);
            expect(result.result).toBe("");
            expect(result.errorMsg).toBe("Failed to check payment status");
        });

        it("should handle different payment statuses correctly", async () => {
            const testCases = [
                { paymentStatus: PaymentState.Paid, expectedOrderStatus: "paid" },
                { paymentStatus: PaymentState.Failed, expectedOrderStatus: "cancelled" },
                {
                    paymentStatus: PaymentState.Cancelled,
                    expectedOrderStatus: "cancelled",
                },
                { paymentStatus: PaymentState.Aborted, expectedOrderStatus: "cancelled" },
                { paymentStatus: "Unknown" as any, expectedOrderStatus: "pending" },
            ];

            for (const testCase of testCases) {
                mockFetch.mockResolvedValue({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            paymentOrder: {
                                ...mockPaymentStatusResponse.paymentOrder,
                                status: testCase.paymentStatus,
                            },
                        } as PaymentOrderResponse),
                });

                await checkPaymentStatus(mockOrderWithPaymentId.id, defaultFormActionState);

                expect(mockUpdateOrderStatus).toHaveBeenCalledWith(
                    mockOrderWithPaymentId.id,
                    defaultFormActionState,
                    testCase.expectedOrderStatus,
                );

                vi.clearAllMocks();
                // Reset mocks for next iteration
                mockGetOrderById.mockResolvedValue({
                    status: 200,
                    result: [mockOrderWithPaymentId],
                    errorMsg: "",
                });
                mockUpdateOrderStatus.mockResolvedValue({
                    status: 200,
                    result: "Order updated successfully",
                    errorMsg: "",
                });
            }
        });
        it("should handle network errors", async () => {
            mockFetch.mockRejectedValue(new Error("Network error"));

            // The current implementation doesn't have try-catch around fetch,
            // so it will throw the error rather than handling it gracefully
            await expect(
                checkPaymentStatus(mockOrderWithPaymentId.id, defaultFormActionState),
            ).rejects.toThrow("Network error");
        });
        it("should handle malformed JSON response", async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.reject(new Error("Invalid JSON")),
            });

            // The current implementation doesn't have try-catch around JSON parsing,
            // so it will throw the error rather than handling it gracefully
            await expect(
                checkPaymentStatus(mockOrderWithPaymentId.id, defaultFormActionState),
            ).rejects.toThrow("Invalid JSON");
        });
    });

    describe("capturePaymentFunds", () => {
        const mockOrder = {
            ...testdata.order,
            paymentRequestId: "/psp/paymentorders/payment-order-id-123",
            payeeRef: "PAYorder111122222531200000", // Add the required payeeRef field
        } as Order;

        const mockPaymentResponse = {
            paymentOrder: {
                id: "/psp/paymentorders/payment-order-id-123",
                status: "Ready",
            },
            operations: [
                {
                    method: "GET",
                    href: "https://ecom.externalintegration.payex.com/checkout/checkout-url-123",
                    rel: "redirect-checkout",
                    contentType: "text/html",
                },
            ],
        };

        beforeEach(() => {
            mockFetch.mockResolvedValue({
                ok: true,
                text: () => Promise.resolve("Capture successful"),
            });
        });

        it("should generate unique payeeReference for capture operation", async () => {
            await capturePaymentFunds(mockOrder);

            expect(mockFetch).toHaveBeenCalledWith(
                `https://api.externalintegration.payex.com${mockOrder.paymentRequestId}/captures`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json;version=3.1",
                        Authorization: `Bearer ${mockEnv.SWEDBANK_PAY_ACCESS_TOKEN}`,
                    },
                    body: expect.stringContaining('CAP"'),
                },
            );

            const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
            expect(requestBody.transaction.payeeReference).toMatch(/^PAY[a-zA-Z0-9]{23}CAP$/);
            expect(requestBody.transaction.payeeReference).toContain("CAP");
        });

        it("should use different payeeReference than authorization", async () => {
            // First call getPaymentRedirectUrl to simulate authorization
            mockGetOrderById.mockResolvedValue({
                status: 200,
                result: [mockOrder],
                errorMsg: "",
            });

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockPaymentResponse),
            });

            await redirectToSwedbankPayment(defaultFormActionState, mockOrder.id);
            const authPayeeRef = JSON.parse(mockFetch.mock.calls[0][1].body).paymentorder.payeeInfo
                .payeeReference;

            // Reset fetch mock for capture call
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve("Capture successful"),
            });

            // Now call capture
            await capturePaymentFunds(mockOrder);
            const capturePayeeRef = JSON.parse(mockFetch.mock.calls[1][1].body).transaction
                .payeeReference;

            expect(authPayeeRef).toMatch(/^PAY/);
            expect(capturePayeeRef).toMatch(/CAP$/);
            expect(authPayeeRef).not.toBe(capturePayeeRef);
        });
    });
});
