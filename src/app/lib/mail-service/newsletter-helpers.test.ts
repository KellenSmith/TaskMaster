import { describe, expect, it, vi } from "vitest";
import { mockContext } from "../../../test/mocks/prismaMock";
import GlobalConstants from "../../GlobalConstants";
import { createNewsletterJob } from "./newsletter-helpers";
import { revalidateTag } from "next/cache";

describe("newsletter-actions", () => {
    it("creates a newsletter job with sanitized recipients and batch size", async () => {
        mockContext.prisma.newsletterJob.create.mockResolvedValue({ id: "job-123" });

        const result = await createNewsletterJob({
            subject: "Hello",
            html: "<p>Content</p>",
            recipients: ["a@example.com", "", "a@example.com", "b@example.com"],
            batchSize: 500,
            replyTo: "reply@example.com",
        });

        expect(mockContext.prisma.newsletterJob.create).toHaveBeenCalledWith({
            data: {
                subject: "Hello",
                html: "<p>Content</p>",
                recipients: ["a@example.com", "b@example.com"],
                batchSize: 250,
                replyTo: "reply@example.com",
                status: "pending",
            },
        });
        expect(vi.mocked(revalidateTag)).toHaveBeenCalledWith(GlobalConstants.SENDOUT, "max");
        expect(result).toEqual({ id: "job-123", total: 2, batchSize: 250 });
    });

    it("deduplicates and filters recipients before creation", async () => {
        mockContext.prisma.newsletterJob.create.mockResolvedValue({ id: "job-dup" });

        await createNewsletterJob({
            subject: "Hello",
            html: "<p>Content</p>",
            recipients: ["", "a@example.com", "a@example.com", "b@example.com"],
            batchSize: 10,
        });

        expect(mockContext.prisma.newsletterJob.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                recipients: ["a@example.com", "b@example.com"],
            }),
        });
    });

    it("throws when creating a job with no recipients", async () => {
        await expect(
            createNewsletterJob({ subject: "Hi", html: "<p>Content</p>", recipients: [] }),
        ).rejects.toThrow("No recipients provided");
    });

    it("throws when recipients are undefined", async () => {
        await expect(
            createNewsletterJob({
                subject: "Hi",
                html: "<p>Content</p>",
                recipients: undefined as any,
            }),
        ).rejects.toThrow("No recipients provided");
    });

    it("clamps batch size to minimum of 1", async () => {
        mockContext.prisma.newsletterJob.create.mockResolvedValue({ id: "job-124" });

        await createNewsletterJob({
            subject: "Hello",
            html: "<p>Content</p>",
            recipients: ["a@example.com"],
            batchSize: 0,
        });

        expect(mockContext.prisma.newsletterJob.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ batchSize: 1 }),
            }),
        );
    });
});
