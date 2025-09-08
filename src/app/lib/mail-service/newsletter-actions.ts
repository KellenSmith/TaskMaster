"use server";

import { prisma } from "../../../../prisma/prisma-client";
import { render } from "@react-email/components";
import MailTemplate from "./mail-templates/MailTemplate";
import { createElement } from "react";
import { getMailTransport } from "./mail-transport";
import { getOrganizationName } from "../organization-settings-actions";
import { revalidateTag } from "next/cache";
import GlobalConstants from "../../GlobalConstants";

type CreateJobInput = {
    subject: string;
    html: string; // rich HTML content to embed in MailTemplate
    recipients: string[]; // snapshot of recipients
    batchSize?: number; // defaults to 250 per provider limit
    perRecipient?: boolean; // defaults to false (use BCC batches)
};

export async function createNewsletterJob(input: CreateJobInput) {
    const batchSize = Math.max(1, Math.min(input.batchSize ?? 250, 250));
    const recipients = Array.from(new Set((input.recipients || []).filter(Boolean)));
    if (recipients.length === 0) throw new Error("No recipients provided");

    const job = await prisma.newsletterJob.create({
        data: {
            subject: input.subject,
            html: input.html,
            recipients: recipients as unknown as object,
            batchSize,
            perRecipient: !!input.perRecipient,
            status: "pending",
        },
    });
    revalidateTag(GlobalConstants.SENDOUT);
    return { id: job.id, total: recipients.length, batchSize };
}

export async function getNewsletterJob(jobId: string) {
    const job = await prisma.newsletterJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error("NewsletterJob not found");
    const recipients: string[] = (job.recipients as unknown as string[]) || [];
    return {
        ...job,
        totalRecipients: recipients.length,
        remaining: Math.max(0, recipients.length - job.cursor),
    };
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

    const recipients: string[] = (job.recipients as unknown as string[]) || [];
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
    const batch = recipients.slice(start, end);

    // Prepare mail
    const organizationName = await getOrganizationName();
    const mailContent = createElement(MailTemplate, { html: job.html });
    const htmlContent = await render(mailContent);

    // Build message
    const domain = process.env.EMAIL?.split("@")[1] || "taskmaster.local";
    const transport = await getMailTransport();

    try {
        let acceptedTotal = 0;
        if (job.perRecipient) {
            // send one-by-one within the same request; keep under provider rate by batching outside
            for (const rcpt of batch) {
                const res = await transport.sendMail({
                    from: `${organizationName} <${process.env.EMAIL}>`,
                    to: rcpt,
                    subject: job.subject,
                    html: htmlContent,
                    text: htmlContent
                        .replace(/<[^>]*>/g, " ")
                        .replace(/\s+/g, " ")
                        .trim(),
                    envelope: { from: `bounce@${domain}`, to: rcpt },
                    headers: {
                        "X-Mailer": `${organizationName} Task Master`,
                        "Auto-Submitted": "auto-generated",
                        "List-Unsubscribe": `<mailto:${process.env.EMAIL}?subject=Unsubscribe>`,
                    },
                });
                acceptedTotal += res?.accepted?.length ? 1 : 0;
            }
        } else {
            // BCC batch send (counts as 1 email to up to 250 recipients per provider docs)
            const res = await transport.sendMail({
                from: `${organizationName} <${process.env.EMAIL}>`,
                bcc: batch.join(", "),
                subject: job.subject,
                html: htmlContent,
                text: htmlContent
                    .replace(/<[^>]*>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim(),
                envelope: { from: `bounce@${domain}` },
                headers: {
                    "X-Mailer": `${organizationName} Task Master`,
                    "Auto-Submitted": "auto-generated",
                    "List-Unsubscribe": `<mailto:${process.env.EMAIL}?subject=Unsubscribe>`,
                },
            });
            acceptedTotal = res?.accepted?.length || 0;
        }

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
            processed: job.perRecipient ? batch.length : acceptedTotal,
            start,
            end: newCursor,
            total,
            done,
        };
    } catch (err: any) {
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
