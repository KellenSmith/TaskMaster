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
    envelope?: {
        from?: string;
        to?: string | string[];
    };
}

const getEmailPayload = async (
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

interface MailResult {
    accepted: number;
    rejected: number;
}
export const sendMail = async (
    recipients: string[],
    subject: string,
    mailContent: ReactElement | Promise<ReactElement>,
    replyTo?: string,
): Promise<MailResult> => {
    const mailPayload = await getEmailPayload(recipients, subject, await mailContent, replyTo);
    const mailTransport = await getMailTransport();
    const mailResponse = await mailTransport.sendMail(mailPayload);
    if (mailResponse.error) throw new Error(mailResponse.error.message);
    return {
        accepted: mailResponse?.accepted?.length || 0,
        rejected: mailResponse?.rejected?.length || 0,
    };
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

    await sendMail(
        reserveEmails,
        `A spot has opened up for the event: ${event.title}`,
        mailContent,
    );
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

    await sendMail(
        [...participantEmails, ...reserveEmails],
        `Cancelled event: ${event.title}`,
        mailContent,
    );
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

    // Queue a newsletter job instead of sending immediately
    const job = await createNewsletterJob({
        subject: sanitizedContent.subject,
        html: sanitizedContent.content,
        recipients,
        batchSize: 250,
    });
    // Keep return shape compatible with existing UI (it shows counts)
    // Actual sending will be processed by the scheduled batch processor
    return {
        accepted: 0,
        rejected: 0,
        jobId: job.id,
        total: recipients.length,
        batchSize: job.batchSize,
    };
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
    await sendMail(
        [order.user.email],
        `Order Confirmation - ${process.env.NEXT_PUBLIC_ORG_NAME}`,
        mailContent,
    );
};
