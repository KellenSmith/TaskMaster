"use server";

import { prisma } from "../../../prisma/prisma-client";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../../GlobalConstants";
import { UuidSchema } from "../zod-schemas";
import { getEmailPayload, isRateLimitError } from "./mail-service";
import { getMailTransport } from "./mail-transport";
import { NEWSLETTER_PROCESS_INTERVAL } from "../../NewsletterTrigger";

type ProcessBatchResult = {
    processed: number;
    done: boolean;
};

// Processes a single batch for the oldest pending/running job or a specific jobId
export async function processNextNewsletterBatch(jobId?: string): Promise<ProcessBatchResult> {
    const job = jobId
        ? await prisma.newsletterJob.findUnique({ where: { id: jobId } })
        : await prisma.newsletterJob.findFirst({
              where: { status: { in: ["pending", "running"] } },
              orderBy: { created_at: "asc" },
          });

    if (!job) return { processed: 0, done: true };
    if (job.lastRunAt && job.lastRunAt.getTime() - Date.now() < NEWSLETTER_PROCESS_INTERVAL)
        return {
            processed: 0,
            done: false,
        };
    if (job.status === "completed" || job.status === "cancelled")
        return { processed: 0, done: true };

    const recipients = job.recipients || [];
    const total = recipients.length;
    if (job.cursor >= total) {
        await prisma.newsletterJob.delete({
            where: { id: job.id },
        });
        return { processed: 0, done: true };
    }

    const start = job.cursor;
    const end = Math.min(start + job.batchSize, total);
    const recipientBatch = recipients.slice(start, end);

    try {
        // BCC batch send (counts as 1 email to up to 250 recipients per one.com docs)
        const mailPayload = await getEmailPayload(
            recipientBatch,
            job.subject,
            job.html,
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

        if (done) {
            // Delete the job when it's completed
            await prisma.newsletterJob.delete({
                where: { id: job.id },
            });
        } else {
            // Update progress for ongoing job
            await prisma.newsletterJob.update({
                where: { id: job.id },
                data: {
                    cursor: newCursor,
                    status: "running",
                    lastRunAt: new Date(),
                    error: null,
                },
            });
        }
        console.log(
            `NewsletterJob ${job.id}: Sent to ${acceptedTotal} recipients (cursor ${newCursor}/${total})`,
        );
        revalidateTag(GlobalConstants.SENDOUT, "max");
        return {
            processed: acceptedTotal,
            done,
        };
    } catch (error) {
        // Don't set to error if it's a rate limit error - keep status as running to retry later
        if (await isRateLimitError(error as Error)) {
            console.warn("Mail rate limit error detected, will retry later", error);
            return {
                processed: 0,
                done: false,
            };
        }
        console.error("Error sending newsletter batch", error);
        await prisma.newsletterJob.update({
            where: { id: job.id },
            data: {
                status: "failed",
                error: (error as Error)?.message || String(error),
                lastRunAt: new Date(),
            },
        });
        return {
            processed: 0,
            done: false,
        };
    }
}

export const deleteNewsletterJob = async (jobId: string) => {
    const validatedJobId = UuidSchema.parse(jobId);
    await prisma.newsletterJob.delete({ where: { id: validatedJobId } });
    revalidateTag(GlobalConstants.SENDOUT, "max");
};
