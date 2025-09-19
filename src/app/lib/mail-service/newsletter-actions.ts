"use server";

import { prisma } from "../../../../prisma/prisma-client";
import MailTemplate from "./mail-templates/MailTemplate";
import { createElement } from "react";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../../GlobalConstants";
import { UuidSchema } from "../zod-schemas";
import { getEmailPayload, isRateLimitError } from "./mail-service";
import { getMailTransport } from "./mail-transport";

type CreateJobInput = {
    subject: string;
    html: string; // rich HTML content to embed in MailTemplate
    recipients: string[]; // snapshot of recipients
    batchSize?: number; // defaults to 250 per provider limit
    replyTo?: string; // optional reply-to address
};

export async function createNewsletterJob(input: CreateJobInput) {
    const batchSize = Math.max(1, Math.min(input.batchSize ?? 250, 250));
    const recipients = [...new Set((input.recipients || []).filter(Boolean))];
    if (recipients.length === 0) throw new Error("No recipients provided");

    const job = await prisma.newsletterJob.create({
        data: {
            subject: input.subject,
            html: input.html,
            recipients,
            batchSize,
            replyTo: input.replyTo,
            status: "pending",
        },
    });
    revalidateTag(GlobalConstants.SENDOUT);
    // Batched are sent when nextauth route is accessed.

    return { id: job.id, total: recipients.length, batchSize };
}

// Processes a single batch for the oldest pending/running job or a specific jobId
export async function processNextNewsletterBatch(jobId?: string) {
    const job = jobId
        ? await prisma.newsletterJob.findUnique({ where: { id: jobId } })
        : await prisma.newsletterJob.findFirst({
              where: { status: { in: ["pending", "running"] } },
              orderBy: { created_at: "asc" },
          });

    if (!job) return { processed: 0, done: true, message: "No pending jobs" };
    if (job.status === "completed" || job.status === "cancelled")
        return { processed: 0, done: true, message: `Job ${job.status}` };

    const recipients = job.recipients || [];
    const total = recipients.length;
    if (job.cursor >= total) {
        await prisma.newsletterJob.update({
            where: { id: job.id },
            data: { status: "completed", completedAt: new Date() },
        });
        return { processed: 0, done: true, message: "Already complete" };
    }

    const start = job.cursor;
    const end = Math.min(start + job.batchSize, total);
    const recipientBatch = recipients.slice(start, end);
    const mailContent = createElement(MailTemplate, { html: job.html });

    try {
        // BCC batch send (counts as 1 email to up to 250 recipients per one.com docs)
        const mailPayload = await getEmailPayload(
            recipientBatch,
            job.subject,
            mailContent,
            job.replyTo,
        );
        const mailTransport = await getMailTransport();
        const mailResponse = await mailTransport.sendMail(mailPayload);
        if (mailResponse.error) {
            throw new Error(mailResponse.error.message);
        }
        const acceptedTotal = mailResponse?.accepted || 0;

        const newCursor = end;
        const done = newCursor >= total;
        await prisma.newsletterJob.update({
            where: { id: job.id },
            data: {
                cursor: newCursor,
                status: done ? "completed" : "running",
                lastRunAt: new Date(),
                completedAt: done ? new Date() : undefined,
                error: null,
            },
        });
        console.log(
            `NewsletterJob ${job.id}: Sent to ${acceptedTotal} recipients (cursor ${newCursor}/${total})`,
        );
        revalidateTag(GlobalConstants.SENDOUT);
        return {
            jobId: job.id,
            processed: acceptedTotal,
            start,
            end: newCursor,
            total,
            done,
        };
    } catch (err: any) {
        // Don't set to error if it's a rate limit error - keep status as running to retry later
        if (await isRateLimitError(err)) {
            console.warn("Mail rate limit error detected, will retry later", err);
            return {
                jobId: job.id,
                processed: 0,
                done: false,
                error: "Rate limit error, will retry",
            };
        }
        console.error("Error sending newsletter batch", err);
        await prisma.newsletterJob.update({
            where: { id: job.id },
            data: { status: "failed", error: err?.message || String(err), lastRunAt: new Date() },
        });
        return { jobId: job.id, processed: 0, done: false, error: err?.message || String(err) };
    }
}

export const getAllNewsletterJobs = async () =>
    await prisma.newsletterJob.findMany({
        orderBy: { created_at: "desc" },
    });

export const deleteNewsletterJob = async (jobId: string) => {
    const validatedJobId = UuidSchema.parse(jobId);
    await prisma.newsletterJob.delete({ where: { id: validatedJobId } });
    revalidateTag(GlobalConstants.SENDOUT);
};
