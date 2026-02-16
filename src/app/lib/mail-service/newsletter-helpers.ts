"use server";

import { revalidateTag } from "next/cache";
import GlobalConstants from "../../GlobalConstants";
import { prisma } from "../../../prisma/prisma-client";

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
    revalidateTag(GlobalConstants.SENDOUT, "max");
    // Batched are sent when nextauth route is accessed.

    return { id: job.id, total: recipients.length, batchSize };
}
