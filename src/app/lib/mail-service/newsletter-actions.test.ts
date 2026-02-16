import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockContext } from "../../../test/mocks/prismaMock";
import GlobalConstants from "../../GlobalConstants";
import { deleteNewsletterJob, processNextNewsletterBatch } from "./newsletter-actions";
import * as mailService from "./mail-service";
import { getMailTransport } from "./mail-transport";
import { revalidateTag } from "next/cache";
import type { Transporter } from "nodemailer";

const buildJob = (overrides: Partial<Record<string, any>> = {}) => ({
    id: "job-1",
    subject: "Subject",
    html: "<p>Hi</p>",
    recipients: ["a@example.com", "b@example.com"],
    batchSize: 2,
    cursor: 0,
    status: "pending",
    replyTo: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
});

describe("newsletter-actions", () => {
    const transportSendMail = vi.fn();
    let getEmailPayloadSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.mocked(getMailTransport).mockResolvedValue({
            sendMail: transportSendMail,
        } as unknown as Transporter);
        getEmailPayloadSpy = vi.spyOn(mailService, "getEmailPayload");
    });

    it("returns no pending jobs when queue is empty", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(null);

        const result = await processNextNewsletterBatch();

        expect(result).toEqual({ processed: 0, done: true });
        expect(mockContext.prisma.newsletterJob.findFirst).toHaveBeenCalledTimes(1);
    });

    it("short-circuits completed jobs", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(
            buildJob({ status: "completed" }),
        );

        const result = await processNextNewsletterBatch();

        expect(result).toEqual({ processed: 0, done: true });
        expect(transportSendMail).not.toHaveBeenCalled();
    });

    it("short-circuits cancelled jobs", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(
            buildJob({ status: "cancelled" }),
        );

        const result = await processNextNewsletterBatch();

        expect(result).toEqual({ processed: 0, done: true });
        expect(transportSendMail).not.toHaveBeenCalled();
    });

    it("deletes jobs that are already complete", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(
            buildJob({ cursor: 2, recipients: ["a@example.com", "b@example.com"] }),
        );
        mockContext.prisma.newsletterJob.delete.mockResolvedValue({ id: "job-1" });

        const result = await processNextNewsletterBatch();

        expect(mockContext.prisma.newsletterJob.delete).toHaveBeenCalledWith({
            where: { id: "job-1" },
        });
        expect(result).toEqual({ processed: 0, done: true });
        expect(transportSendMail).not.toHaveBeenCalled();
    });

    it("treats missing recipients as empty and deletes the job", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(
            buildJob({ recipients: undefined, cursor: 0 }),
        );
        mockContext.prisma.newsletterJob.delete.mockResolvedValue({ id: "job-1" });

        const result = await processNextNewsletterBatch();

        expect(mockContext.prisma.newsletterJob.delete).toHaveBeenCalledWith({
            where: { id: "job-1" },
        });
        expect(result).toEqual({ processed: 0, done: true });
    });

    it("processes a batch and updates cursor for ongoing jobs", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(
            buildJob({ recipients: ["a@example.com", "b@example.com", "c@example.com"] }),
        );
        transportSendMail.mockResolvedValue({ accepted: 2 });

        const result = await processNextNewsletterBatch();

        expect(getEmailPayloadSpy).toHaveBeenCalledWith(
            ["a@example.com", "b@example.com"],
            "Subject",
            "<p>Hi</p>",
            null,
        );
        expect(mockContext.prisma.newsletterJob.update).toHaveBeenCalledWith({
            where: { id: "job-1" },
            data: expect.objectContaining({
                cursor: 2,
                status: "running",
                error: null,
            }),
        });
        expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.SENDOUT, "max");
        expect(result).toEqual({
            processed: 2,
            done: false,
        });
    });

    it("deletes job when final batch completes", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(buildJob());
        mockContext.prisma.newsletterJob.delete.mockResolvedValue({ id: "job-1" });
        transportSendMail.mockResolvedValue({ accepted: 2 });

        const result = await processNextNewsletterBatch();

        expect(mockContext.prisma.newsletterJob.delete).toHaveBeenCalledWith({
            where: { id: "job-1" },
        });
        expect(result).toEqual({
            processed: 2,
            done: true,
        });
    });

    it("counts accepted as zero when transport response omits accepted", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(buildJob());
        mockContext.prisma.newsletterJob.delete.mockResolvedValue({ id: "job-1" });
        transportSendMail.mockResolvedValue({});

        const result = await processNextNewsletterBatch();

        expect(result.processed).toBe(0);
        expect(mockContext.prisma.newsletterJob.delete).toHaveBeenCalled();
    });

    it("retrieves job by id when provided", async () => {
        mockContext.prisma.newsletterJob.findUnique.mockResolvedValue(buildJob());
        transportSendMail.mockResolvedValue({ accepted: 2 });

        await processNextNewsletterBatch("job-1");

        expect(mockContext.prisma.newsletterJob.findUnique).toHaveBeenCalledWith({
            where: { id: "job-1" },
        });
        expect(mockContext.prisma.newsletterJob.findFirst).not.toHaveBeenCalled();
    });

    it("handles rate limit errors without failing the job", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(buildJob());
        transportSendMail.mockRejectedValue(new Error("Rate limit exceeded"));
        vi.spyOn(mailService, "isRateLimitError").mockResolvedValue(true);

        const result = await processNextNewsletterBatch();

        expect(result).toEqual({
            processed: 0,
            done: false,
        });
        expect(mockContext.prisma.newsletterJob.update).not.toHaveBeenCalled();
    });

    it("marks job failed on non-rate-limit errors", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(buildJob());
        transportSendMail.mockRejectedValue(new Error("SMTP down"));

        const result = await processNextNewsletterBatch();

        expect(mockContext.prisma.newsletterJob.update).toHaveBeenCalledWith({
            where: { id: "job-1" },
            data: expect.objectContaining({
                status: "failed",
                error: "SMTP down",
            }),
        });
        expect(result).toEqual({
            processed: 0,
            done: false,
        });
    });

    it("stores string errors when mail transport rejects with a string", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(buildJob());
        transportSendMail.mockRejectedValue("SMTP down");

        const result = await processNextNewsletterBatch();

        expect(mockContext.prisma.newsletterJob.update).toHaveBeenCalledWith({
            where: { id: "job-1" },
            data: expect.objectContaining({
                status: "failed",
                error: "SMTP down",
            }),
        });
        expect(result).toEqual({
            processed: 0,
            done: false,
        });
    });

    it("marks job failed when transport reports an error", async () => {
        mockContext.prisma.newsletterJob.findFirst.mockResolvedValue(buildJob());
        transportSendMail.mockResolvedValue({ error: { message: "SMTP down" } });

        const result = await processNextNewsletterBatch();

        expect(mockContext.prisma.newsletterJob.update).toHaveBeenCalledWith({
            where: { id: "job-1" },
            data: expect.objectContaining({
                status: "failed",
                error: "SMTP down",
            }),
        });
        expect(result).toEqual({
            processed: 0,
            done: false,
        });
    });

    it("deletes a newsletter job by id and revalidates", async () => {
        mockContext.prisma.newsletterJob.delete.mockResolvedValue({ id: "job-1" });

        await deleteNewsletterJob("550e8400-e29b-41d4-a716-446655440000");

        expect(mockContext.prisma.newsletterJob.delete).toHaveBeenCalledWith({
            where: { id: "550e8400-e29b-41d4-a716-446655440000" },
        });
        expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.SENDOUT, "max");
    });

    it("rejects deletion when job id is invalid", async () => {
        await expect(deleteNewsletterJob("not-a-uuid")).rejects.toThrow();
        expect(mockContext.prisma.newsletterJob.delete).not.toHaveBeenCalled();
    });
});
