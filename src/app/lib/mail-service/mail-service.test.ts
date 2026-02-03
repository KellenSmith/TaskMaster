import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { mockContext } from "../../../test/mocks/prismaMock";
import { getMailTransport } from "./mail-transport";
import { createNewsletterJob } from "./newsletter-actions";
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

vi.mock("./newsletter-actions", () => ({
    createNewsletterJob: vi.fn(),
}));

vi.mock("../../../../prisma/prisma-client", () => ({
    prisma: mockContext.prisma,
}));

describe("mail-service", () => {
    it("detects rate limit errors", async () => {
        await expect(isRateLimitError(new Error("Rate limit exceeded"))).resolves.toBe(true);
        await expect(isRateLimitError(new Error("SMTP unavailable"))).resolves.toBe(false);
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
        expect(payload.headers?.["Message-ID"]).toEqual(
            expect.stringContaining("@example.com>"),
        );
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
            getEmailPayload(["invalid"], "Subject", "<p>Hi</p>"),
        ).rejects.toBeInstanceOf(Error);
    });

    it("sends mail directly for small recipient lists", async () => {
        const transport = await getMailTransport();
        vi.mocked(transport.sendMail).mockResolvedValue({ accepted: ["user@example.com"], rejected: [] });

        const result = await sendMail(["user@example.com"], "Subject", createElement("div"));

        expect(result).toEqual({ accepted: 1, rejected: 0 });
        expect(transport.sendMail).toHaveBeenCalledTimes(1);
        const [payload] = vi.mocked(transport.sendMail).mock.calls[0];
        expect(payload.subject).toBe("Subject");
    });

    it("rethrows non-rate-limit errors", async () => {
        const transport = await getMailTransport();
        vi.mocked(transport.sendMail).mockResolvedValue({ error: { message: "SMTP down" } });
        await expect(sendMail(["user@example.com"], "Subject", createElement("div"))).rejects.toThrow(
            "SMTP down",
        );
    });

    it("creates a fallback newsletter job on rate limit error", async () => {
        const transport = await getMailTransport();
        vi.mocked(transport.sendMail).mockRejectedValueOnce(new Error("Rate limit exceeded"));
        vi.mocked(createNewsletterJob).mockResolvedValue({
            id: "job-1",
            total: 1,
            batchSize: 50,
        });

        const result = await sendMail(["user@example.com"], "Subject", createElement("div"));

        expect(createNewsletterJob).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ accepted: 0, rejected: 0, fallbackJobId: "job-1" });
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
        expect(result.fallbackJobId).toBe("job-2");
        expect(transport.sendMail).not.toHaveBeenCalled();
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
        vi.mocked(transport.sendMail).mockResolvedValue({ accepted: ["reserve@example.com"], rejected: [] });

        await notifyEventReserves("event-1");

        expect(transport.sendMail).toHaveBeenCalledTimes(1);
        const [payload] = vi.mocked(transport.sendMail).mock.calls[0];
        expect(payload.subject).toContain("Event Title");
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
        mockContext.prisma.order.findUniqueOrThrow.mockResolvedValue({
            id: "order-1",
            user: { email: "buyer@example.com" },
            order_items: [],
        });
        vi.mocked(transport.sendMail).mockResolvedValue({ accepted: ["buyer@example.com"], rejected: [] });

        await sendOrderConfirmation("order-1");

        expect(transport.sendMail).toHaveBeenCalledTimes(1);
        const [payload] = vi.mocked(transport.sendMail).mock.calls[0];
        expect(payload.subject).toBe("Receipt - TaskMaster");
    });
});
