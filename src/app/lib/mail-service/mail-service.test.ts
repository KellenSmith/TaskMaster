import { describe, expect, it, vi } from "vitest";
import { mockContext } from "../../../test/mocks/prismaMock";
import { getMailTransport } from "./mail-transport";
import { createNewsletterJob } from "./newsletter-helpers";
import * as htmlSanitizer from "../html-sanitizer";
import {
    getEmailPayload,
    getEmailRecipientCount,
    informOfCancelledEvent,
    isRateLimitError,
    notifyEventReserves,
    sendMail,
    sendMassEmail,
    sendOrderConfirmation,
} from "./mail-service";
import { createElement } from "react";
import testdata from "../../../test/testdata";
import { Prisma } from "../../../prisma/generated/client";

vi.mock("./newsletter-helpers", () => ({
    createNewsletterJob: vi.fn(),
}));

vi.mock("../../../prisma/prisma-client", () => ({
    prisma: mockContext.prisma,
}));

describe("mail-service", () => {
    it("detects rate limit errors", async () => {
        await expect(isRateLimitError(new Error("Rate limit exceeded"))).resolves.toBe(true);
        await expect(isRateLimitError(new Error("SMTP unavailable"))).resolves.toBe(false);
    });

    it("handles non-error inputs in rate limit detection", async () => {
        await expect(isRateLimitError({} as Error)).resolves.toBe(false);
    });

    it("handles null errors in rate limit detection", async () => {
        await expect(isRateLimitError(null as unknown as Error)).resolves.toBe(false);
    });

    it("builds an email payload for a single recipient", async () => {
        const payload = await getEmailPayload(
            ["user@example.com"],
            "Subject",
            "<p>Hello <strong>world</strong></p>",
        );

        expect(payload.to).toBe("user@example.com");
        expect(payload.bcc).toBeUndefined();
        expect(payload.subject).toBe("Subject");
        expect(payload.text).toBe("Hello world");
        expect(payload.headers?.["X-Mailer"]).toBe("TaskMaster Task Master");
        expect(payload.headers?.["Message-ID"]).toEqual(expect.stringContaining("@example.com>"));
    });

    it("builds an email payload for multiple recipients", async () => {
        const payload = await getEmailPayload(
            ["a@example.com", "b@example.com"],
            "Subject",
            "<p>Hi</p>",
        );

        expect(payload.to).toBe("undisclosed-recipients:;");
        expect(payload.bcc).toBe("a@example.com, b@example.com");
    });

    it("throws when recipients are invalid", async () => {
        await expect(getEmailPayload([], "Subject", "<p>Hi</p>")).rejects.toThrow(
            "Invalid email address(es) provided",
        );
        await expect(
            getEmailPayload(undefined as unknown as string[], "Subject", "<p>Hi</p>"),
        ).rejects.toThrow("Invalid email address(es) provided");
        await expect(
            getEmailPayload([undefined as unknown as string], "Subject", "<p>Hi</p>"),
        ).rejects.toBeInstanceOf(Error);
        await expect(getEmailPayload(["invalid"], "Subject", "<p>Hi</p>")).rejects.toBeInstanceOf(
            Error,
        );
    });

    it("adds reply-to when provided", async () => {
        const payload = await getEmailPayload(
            ["user@example.com"],
            "Subject",
            "<p>Hi</p>",
            "reply@example.com",
        );

        expect(payload.replyTo).toBe("reply@example.com");
    });

    it("uses raw html when mail content is a string", async () => {
        const payload = await getEmailPayload(["user@example.com"], "Subject", "<p>Raw</p>");

        expect(payload.html).toBe("<p>Raw</p>");
    });

    it("renders html content when given a React element", async () => {
        const payload = await getEmailPayload(
            ["user@example.com"],
            "Subject",
            createElement("div"),
        );

        expect(payload.html).toContain("<div");
    });

    it("trims recipient emails and uses fallback domain when EMAIL is unset", async () => {
        const payload = await getEmailPayload(["  user@example.com  "], "Subject", "<p>Hi</p>");

        expect(payload.to).toBe("user@example.com");
        expect(payload.headers?.["Message-ID"]).toEqual(
            expect.stringContaining(testdata.env.EMAIL.split("@")[1] + ">"),
        );
    });

    it("throws when EMAIL env is malformed", async () => {
        process.env.EMAIL = "malformed-email";
        await expect(getEmailPayload(["user@example.com"], "Subject", "<p>Hi</p>")).rejects.toThrow(
            "Sender email is not configured",
        );
    });

    it("sends mail directly for small recipient lists", async () => {
        const transport = await getMailTransport();
        vi.mocked(transport.sendMail).mockResolvedValue({
            accepted: ["user@example.com"],
            rejected: [],
        });

        const result = await sendMail(["user@example.com"], "Subject", createElement("div"));

        expect(result).toEqual({ accepted: 1, rejected: 0 });
        expect(transport.sendMail).toHaveBeenCalledTimes(1);
        const [payload] = vi.mocked(transport.sendMail).mock.calls[0];
        expect(payload.subject).toBe("Subject");
    });

    it("counts rejected recipients when mail transport returns rejections", async () => {
        const transport = await getMailTransport();
        vi.mocked(transport.sendMail).mockResolvedValue({
            accepted: [],
            rejected: ["user@example.com"],
        });

        const result = await sendMail(["user@example.com"], "Subject", createElement("div"));

        expect(result).toEqual({ accepted: 0, rejected: 1 });
    });

    it("rethrows non-rate-limit errors", async () => {
        const transport = await getMailTransport();
        vi.mocked(transport.sendMail).mockResolvedValue({ error: { message: "SMTP down" } });
        await expect(
            sendMail(["user@example.com"], "Subject", createElement("div")),
        ).rejects.toThrow("SMTP down");
    });

    it("creates a fallback newsletter job on rate limit error", async () => {
        const transport = await getMailTransport();
        vi.mocked(transport.sendMail).mockRejectedValueOnce(new Error("Rate limit exceeded"));
        vi.mocked(createNewsletterJob).mockResolvedValue({
            id: "job-1",
            total: 1,
            batchSize: 1,
        });

        const result = await sendMail(["user@example.com"], "Subject", createElement("div"));

        expect(createNewsletterJob).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ accepted: 0, rejected: 0, fallbackJobId: "job-1" });
    });

    it("uses smaller batch size for tiny recipient lists", async () => {
        const transport = await getMailTransport();
        vi.mocked(transport.sendMail).mockRejectedValueOnce(new Error("Rate limit exceeded"));
        vi.mocked(createNewsletterJob).mockResolvedValue({
            id: "job-3",
            total: 5,
            batchSize: 5,
        });

        const recipients = Array.from({ length: 5 }, (_, index) => `u${index}@test.com`);
        await sendMail(recipients, "Subject", createElement("div"));

        expect(createNewsletterJob).toHaveBeenCalledWith(
            expect.objectContaining({
                recipients,
                batchSize: 5,
            }),
        );
    });

    it("uses smaller batch size for small recipient lists", async () => {
        const transport = await getMailTransport();
        vi.mocked(transport.sendMail).mockRejectedValueOnce(new Error("Rate limit exceeded"));
        vi.mocked(createNewsletterJob).mockResolvedValue({
            id: "job-4",
            total: 50,
            batchSize: 25,
        });

        const recipients = Array.from({ length: 50 }, (_, index) => `u${index}@test.com`);
        await sendMail(recipients, "Subject", createElement("div"));

        expect(createNewsletterJob).toHaveBeenCalledWith(
            expect.objectContaining({
                recipients,
                batchSize: 25,
            }),
        );
    });

    it("uses medium batch size for mid-sized recipient lists", async () => {
        const transport = await getMailTransport();
        vi.mocked(transport.sendMail).mockRejectedValueOnce(new Error("Rate limit exceeded"));
        vi.mocked(createNewsletterJob).mockResolvedValue({
            id: "job-5",
            total: 200,
            batchSize: 50,
        });

        const recipients = Array.from({ length: 200 }, (_, index) => `u${index}@test.com`);
        await sendMail(recipients, "Subject", createElement("div"));

        expect(createNewsletterJob).toHaveBeenCalledWith(
            expect.objectContaining({
                recipients,
                batchSize: 50,
            }),
        );
    });

    it("creates a fallback job when recipient count exceeds limit", async () => {
        const transport = await getMailTransport();
        vi.mocked(createNewsletterJob).mockResolvedValue({
            id: "job-2",
            total: 251,
            batchSize: 250,
        });

        const recipients = Array.from({ length: 251 }, (_, index) => `user${index}@test.com`);
        const result = await sendMail(recipients, "Subject", createElement("div"));

        expect(createNewsletterJob).toHaveBeenCalledTimes(1);
        expect(createNewsletterJob).toHaveBeenCalledWith(
            expect.objectContaining({
                batchSize: 250,
            }),
        );
        expect(result.fallbackJobId).toBe("job-2");
        expect(transport.sendMail).not.toHaveBeenCalled();
    });

    it("rethrows original error when fallback job creation fails", async () => {
        const transport = await getMailTransport();
        vi.mocked(transport.sendMail).mockRejectedValueOnce(new Error("Rate limit exceeded"));
        vi.mocked(createNewsletterJob).mockRejectedValueOnce(new Error("db down"));
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

        await expect(
            sendMail(["user@example.com"], "Subject", createElement("div")),
        ).rejects.toThrow("Rate limit exceeded");

        expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Fallback newsletter job creation failed"),
        );
        errorSpy.mockRestore();
    });

    it("notifies event reserves when emails exist", async () => {
        const transport = await getMailTransport();
        mockContext.prisma.eventReserve.findMany.mockResolvedValue([
            { user: { email: "reserve@example.com" } },
        ]);
        mockContext.prisma.event.findUniqueOrThrow.mockResolvedValue({
            id: "event-1",
            title: "Event Title",
        });
        vi.mocked(transport.sendMail).mockResolvedValue({
            accepted: ["reserve@example.com"],
            rejected: [],
        });

        await notifyEventReserves("event-1");

        expect(transport.sendMail).toHaveBeenCalledTimes(1);
        const [payload] = vi.mocked(transport.sendMail).mock.calls[0];
        expect(payload.subject).toContain("Event Title");
    });

    it("logs when reserve notification is queued as fallback job", async () => {
        const transport = await getMailTransport();
        mockContext.prisma.eventReserve.findMany.mockResolvedValue([
            { user: { email: "reserve@example.com" } },
        ]);
        mockContext.prisma.event.findUniqueOrThrow.mockResolvedValue({
            id: "event-1",
            title: "Event Title",
        });
        vi.mocked(transport.sendMail).mockRejectedValueOnce(new Error("Rate limit exceeded"));
        vi.mocked(createNewsletterJob).mockResolvedValue({
            id: "job-10",
            total: 1,
            batchSize: 50,
        });
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

        await notifyEventReserves("event-1");

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("newsletter job job-10"));
        logSpy.mockRestore();
    });

    it("skips notifying reserves when none exist", async () => {
        const transport = await getMailTransport();
        mockContext.prisma.eventReserve.findMany.mockResolvedValue([]);

        await notifyEventReserves("event-1");

        expect(transport.sendMail).not.toHaveBeenCalled();
    });

    it("informs participants and reserves about cancellations", async () => {
        const transport = await getMailTransport();
        mockContext.prisma.eventParticipant.findMany.mockResolvedValue([
            { user: { email: "participant@example.com" } },
        ]);
        mockContext.prisma.eventReserve.findMany.mockResolvedValue([
            { user: { email: "reserve@example.com" } },
        ]);
        mockContext.prisma.event.findUniqueOrThrow.mockResolvedValue({
            id: "event-1",
            title: "Cancelled Event",
        });
        vi.mocked(transport.sendMail).mockResolvedValue({
            accepted: ["participant@example.com", "reserve@example.com"],
            rejected: [],
        });

        await informOfCancelledEvent("event-1");

        expect(transport.sendMail).toHaveBeenCalledTimes(1);
        const [payload] = vi.mocked(transport.sendMail).mock.calls[0];
        expect(payload.subject).toContain("Cancelled Event");
    });

    it("logs when cancellation notification is queued as fallback job", async () => {
        const transport = await getMailTransport();
        mockContext.prisma.eventParticipant.findMany.mockResolvedValue([
            { user: { email: "participant@example.com" } },
        ]);
        mockContext.prisma.eventReserve.findMany.mockResolvedValue([
            { user: { email: "reserve@example.com" } },
        ]);
        mockContext.prisma.event.findUniqueOrThrow.mockResolvedValue({
            id: "event-1",
            title: "Cancelled Event",
        });
        vi.mocked(transport.sendMail).mockRejectedValueOnce(new Error("Rate limit exceeded"));
        vi.mocked(createNewsletterJob).mockResolvedValue({
            id: "job-11",
            total: 2,
            batchSize: 50,
        });
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

        await informOfCancelledEvent("event-1");

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("newsletter job job-11"));
        logSpy.mockRestore();
    });

    it("skips cancellation notice when no recipients", async () => {
        const transport = await getMailTransport();
        mockContext.prisma.eventParticipant.findMany.mockResolvedValue([]);
        mockContext.prisma.eventReserve.findMany.mockResolvedValue([]);

        await informOfCancelledEvent("event-1");

        expect(transport.sendMail).not.toHaveBeenCalled();
    });

    it("returns recipient count for mass email", async () => {
        mockContext.prisma.user.count.mockResolvedValue(12);

        const count = await getEmailRecipientCount({} as Prisma.UserWhereInput);

        expect(count).toBe(12);
    });

    it("sends mass email using sanitized content", async () => {
        const transport = await getMailTransport();
        mockContext.prisma.user.findMany.mockResolvedValue([
            { email: "a@example.com" },
            { email: "b@example.com" },
        ] as Array<Prisma.UserGetPayload<{ select: { email: true } }>>);
        const sanitizeSpy = vi.spyOn(htmlSanitizer, "sanitizeFormData").mockReturnValue({
            subject: "Sanitized",
            content: "<p>Safe</p>",
        });
        vi.mocked(transport.sendMail).mockResolvedValue({ accepted: ["a", "b"], rejected: [] });

        const formData = new FormData();
        formData.set("subject", "Original");
        formData.set("content", "<p>Unsafe</p>");

        await sendMassEmail({} as Prisma.UserWhereInput, formData);

        expect(sanitizeSpy).toHaveBeenCalled();
        const [payload] = vi.mocked(transport.sendMail).mock.calls[0];
        expect(payload.subject).toBe("Sanitized");
        expect(payload.bcc).toBe("a@example.com, b@example.com");
    });

    it("sends order confirmation email", async () => {
        const transport = await getMailTransport();
        const testOrder = {
            id: "order-1",
            total_amount: 1000,
            user: { email: "buyer@example.com" },
            order_items: [],
        };
        vi.mocked(transport.sendMail).mockResolvedValue({
            accepted: ["buyer@example.com"],
            rejected: [],
        });

        await sendOrderConfirmation(testOrder);

        expect(transport.sendMail).toHaveBeenCalledTimes(1);
        const [payload] = vi.mocked(transport.sendMail).mock.calls[0];
        expect(payload.subject).toBe("Receipt - TaskMaster");
    });

    it("throws when order has no associated user", async () => {
        const testOrder = {
            id: "order-4",
            total_amount: 500,
            user: null,
            order_items: [],
        };

        await expect(sendOrderConfirmation(testOrder)).rejects.toThrow(
            "Order order-4 has no associated user",
        );
    });

    it("logs when order confirmation is queued as fallback job", async () => {
        const transport = await getMailTransport();
        const testOrder = {
            id: "order-2",
            total_amount: 1000,
            user: { email: "buyer@example.com" },
            order_items: [],
        };
        vi.mocked(transport.sendMail).mockRejectedValueOnce(new Error("Rate limit exceeded"));
        vi.mocked(createNewsletterJob).mockResolvedValue({
            id: "job-12",
            total: 1,
            batchSize: 50,
        });
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

        await sendOrderConfirmation(testOrder);

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("newsletter job job-12"));
        logSpy.mockRestore();
    });
});
