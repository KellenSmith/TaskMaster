"use server";

import { getMailTransport } from "./mail-transport";
import { createElement, ReactElement } from "react";
import { render } from "@react-email/components";
import { prisma } from "../../../../prisma/prisma-client";
import { Prisma } from "@prisma/client";
import EventCancelledTemplate from "./mail-templates/EventCancelledTemplate";
import OrderConfirmationTemplate from "./mail-templates/OrderConfirmationTemplate";
import { EmailSendoutSchema } from "../zod-schemas";
import OpenEventSpotTemplate from "./mail-templates/OpenEventSpotTemplate";
import { getEventParticipantEmails } from "../event-participant-actions";
import { getEventReservesEmails } from "../event-reserve-actions";
import { sanitizeFormData } from "../html-sanitizer";
import { createNewsletterJob } from "./newsletter-actions";
import z from "zod";
import MailTemplate from "./mail-templates/MailTemplate";
import { MailResult } from "../../ui/utils";

/**
 * Checks if an error indicates rate limiting from the email provider
 */
export const isRateLimitError = async (error: any): Promise<boolean> => {
    const errorMessage = (error?.message || error || "").toString().toLowerCase();

    // Common rate limiting message patterns
    const rateLimitPatterns = [
        "rate limit",
        "rate exceeded",
        "throttl",
        "too many",
        "quota",
        "limit exceeded",
        "try again later",
        "submission rate",
        "sending limit",
        "daily limit",
        "hourly limit",
    ];

    return rateLimitPatterns.some((pattern) => errorMessage.includes(pattern));
};

/**
 * Creates a newsletter job as fallback when rate limiting is detected
 */
const createFallbackNewsletterJob = async (
    recipients: string[],
    subject: string,
    mailContent: ReactElement,
    replyTo?: string,
): Promise<{ jobId: string; total: number }> => {
    const job = await createNewsletterJob({
        subject,
        html: await render(mailContent),
        recipients,
        batchSize: 50, // Use smaller batch size for fallback
        replyTo,
    });

    return { jobId: job.id, total: job.total };
};

interface EmailPayload {
    from: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    subject: string;
    html: string;
    headers?: Record<string, string>;
    text?: string; // Plain text version for better deliverability
}

export const getEmailPayload = async (
    receivers: string[],
    subject: string,
    mailContent: ReactElement,
    replyTo?: string,
): Promise<EmailPayload> => {
    // Normalize and validate recipients
    const recipients = (receivers || []).map((s) => z.email().parse((s || "").trim()));
    if (recipients.length === 0) {
        throw new Error("Invalid email address(es) provided");
    }

    // Base payload
    const domain = process.env.EMAIL?.split("@")[1] || "taskmaster.local";
    const htmlContent = await render(mailContent);
    const strippedTextContent = htmlContent
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const payload: EmailPayload = {
        from: `${process.env.NEXT_PUBLIC_ORG_NAME} <${process.env.EMAIL}>`,
        subject,
        html: htmlContent,
        // Add plain text version by stripping HTML
        text: strippedTextContent,
        headers: {
            "X-Mailer": `${process.env.NEXT_PUBLIC_ORG_NAME} Task Master`,
            "X-Priority": "3",
            "List-Unsubscribe": `<mailto:${process.env.EMAIL}?subject=Unsubscribe>`,
            "Auto-Submitted": "auto-generated",
            "Message-ID": `<${Date.now()}-${Math.random().toString(36).slice(2, 11)}@${domain}>`,
        },
    };

    // Set header recipients: single uses To, multi uses BCC and an undisclosed To
    if (recipients.length === 1) {
        payload.to = recipients[0];
    } else {
        payload.to = "undisclosed-recipients:;";
        payload.bcc = recipients.join(", ");
    }
    if (replyTo) payload.replyTo = replyTo;
    return payload;
};

export const sendMail = async (
    recipients: string[],
    subject: string,
    mailContent: ReactElement | Promise<ReactElement>,
    replyTo?: string,
): Promise<MailResult> => {
    const resolvedContent = await mailContent;
    try {
        const mailPayload = await getEmailPayload(recipients, subject, resolvedContent, replyTo);
        const mailTransport = await getMailTransport();
        if (mailTransport) throw new Error("rate limit");
        const mailResponse = await mailTransport.sendMail(mailPayload);
        if (mailResponse.error) {
            throw new Error(mailResponse.error.message);
        }
        return {
            accepted: mailResponse?.accepted?.length || 0,
            rejected: mailResponse?.rejected?.length || 0,
        };
    } catch (error: any) {
        // Check if the error indicates rate limiting
        if (await isRateLimitError(error)) {
            console.warn(
                `Mail rate limiting detected: ${error.message}. Creating newsletter job as fallback.`,
            );

            try {
                const fallbackJob = await createFallbackNewsletterJob(
                    recipients,
                    subject,
                    resolvedContent,
                    replyTo,
                );

                return {
                    accepted: 0,
                    rejected: 0,
                    fallbackJobId: fallbackJob.jobId,
                };
            } catch (fallbackError: any) {
                // If fallback also fails, throw the original error
                console.error(`Fallback newsletter job creation failed: ${fallbackError.message}`);
                throw error;
            }
        }

        // For non-rate-limiting errors, throw the original error
        throw error;
    }
};

/**
 * @throws Error if email fails
 */
export const notifyEventReserves = async (eventId: string): Promise<void> => {
    const reserveEmails = await getEventReservesEmails(eventId);
    if (reserveEmails.length === 0) return;

    const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    const mailContent = createElement(OpenEventSpotTemplate, {
        event,
    });

    const result = await sendMail(
        reserveEmails,
        `A spot has opened up for the event: ${event.title}`,
        mailContent,
    );

    if (result.fallbackJobId) {
        console.log(
            `Event reserve notification queued as newsletter job ${result.fallbackJobId} due to rate limiting`,
        );
    }
};

/**
 * @throws Error if email fails
 */
export const informOfCancelledEvent = async (eventId: string): Promise<void> => {
    const participantEmails = await getEventParticipantEmails(eventId);
    const reserveEmails = await getEventReservesEmails(eventId);
    if (participantEmails.length === 0 && reserveEmails.length === 0) return;

    const event = await prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        select: { id: true, title: true },
    });
    const mailContent = createElement(EventCancelledTemplate, {
        event: event,
    });

    const result = await sendMail(
        [...participantEmails, ...reserveEmails],
        `Cancelled event: ${event.title}`,
        mailContent,
    );

    if (result.fallbackJobId) {
        console.log(
            `Event cancellation notification queued as newsletter job ${result.fallbackJobId} due to rate limiting`,
        );
    }
};

export const getEmailRecipientCount = async (
    recipientCriteria: Prisma.UserWhereInput,
): Promise<number> => {
    const recipientCount = await prisma.user.count({
        where: recipientCriteria,
    });
    return recipientCount;
};

/**
 * @throws Error if email fails
 */
type MassEmailResult = { accepted: number; rejected: number } & Partial<{
    jobId: string;
    total: number;
    batchSize: number;
}>;

export const sendMassEmail = async (
    recipientCriteria: Prisma.UserWhereInput,
    formData: FormData,
): Promise<MassEmailResult> => {
    const recipients = (
        await prisma.user.findMany({
            where: recipientCriteria,
            select: {
                email: true,
            },
        })
    ).map((user: Prisma.UserGetPayload<true>) => user.email);

    const revalidatedContent = EmailSendoutSchema.parse(Object.fromEntries(formData.entries()));

    // Sanitize rich text content before sending email
    const sanitizedContent = sanitizeFormData(revalidatedContent);
    const mailContent = createElement(MailTemplate, { html: sanitizedContent.content });
    return await sendMail(recipients, sanitizedContent.subject, mailContent);
};

export const sendOrderConfirmation = async (orderId: string): Promise<void> => {
    const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
            user: {
                select: {
                    email: true,
                },
            },
            order_items: {
                include: {
                    product: {
                        select: {
                            name: true,
                            description: true,
                        },
                    },
                },
            },
        },
    });
    const mailContent = createElement(OrderConfirmationTemplate, { order });
    const result = await sendMail(
        [order.user.email],
        `Order Confirmation - ${process.env.NEXT_PUBLIC_ORG_NAME}`,
        mailContent,
    );

    if (result.fallbackJobId) {
        console.log(
            `Order confirmation queued as newsletter job ${result.fallbackJobId} due to rate limiting`,
        );
    }
};
