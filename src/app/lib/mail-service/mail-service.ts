"use server";

import { getMailTransport } from "./mail-transport";
import { createElement, ReactElement } from "react";
import MembershipExpiresReminderTemplate from "./mail-templates/MembershipExpiresReminderTemplate";
import { render } from "@react-email/components";
import MailTemplate from "./mail-templates/MailTemplate";
import { prisma } from "../../../../prisma/prisma-client";
import { Prisma } from "@prisma/client";
import EventCancelledTemplate from "./mail-templates/EventCancelledTemplate";
import OrderConfirmationTemplate from "./mail-templates/OrderConfirmationTemplate";
import { getOrganizationName, getOrganizationSettings } from "../organization-settings-actions";
import { EmailSendoutSchema, MembershipApplicationSchema } from "../zod-schemas";
import z from "zod";
import OpenEventSpotTemplate from "./mail-templates/OpenEventSpotTemplate";
import { getEventParticipantEmails } from "../event-participant-actions";
import { getEventReservesEmails } from "../event-reserve-actions";
import MembershipApplicationTemplate from "./mail-templates/MembershipApplicationTemplate";
import TaskUpdateTemplate from "./mail-templates/TaskUpdateTemplate";
import EmailNotificationTemplate, {
    MailButtonLink,
} from "./mail-templates/MailNotificationTemplate";
import MemberContactMemberTemplate from "./mail-templates/MemberContactMemberTemplate";
import SignInEmailTemplate from "./mail-templates/SignInEmailTemplate";
import { sanitizeFormData } from "../html-sanitizer";

interface EmailPayload {
    from: string;
    bcc: string;
    replyTo?: string;
    subject: string;
    html: string;
    headers?: Record<string, string>;
    text?: string; // Plain text version for better deliverability
}

const getEmailPayload = async (
    receivers: string[],
    subject: string,
    mailContent: ReactElement,
    replyTo?: string,
): Promise<EmailPayload> => {
    const organizationName = await getOrganizationName();
    const htmlContent = await render(mailContent);

    const payload: EmailPayload = {
        from: `${organizationName} <${process.env.EMAIL}>`,
        bcc: receivers.join(", "),
        subject: subject,
        html: htmlContent,
        // Add plain text version by stripping HTML
        text: htmlContent
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim(),
        headers: {
            "X-Mailer": `${organizationName} Task Master`,
            "X-Priority": "3",
            "List-Unsubscribe": `<mailto:${process.env.EMAIL}?subject=Unsubscribe>`,
            "Message-ID": `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@${process.env.EMAIL?.split("@")[1] || "taskmaster.local"}>`,
        },
    };
    if (replyTo) payload.replyTo = replyTo;
    return payload;
};

/**
 * Sends a sign-in email with magic link for authentication
 * @throws Error if email fails
 */
export const sendSignInEmail = async (email: string, url: string): Promise<string> => {
    const organizationName = await getOrganizationName();
    const mailContent = createElement(SignInEmailTemplate, {
        email,
        url,
    });

    const transport = await getMailTransport();
    const mailResponse = await transport.sendMail(
        await getEmailPayload([email], `Sign in to ${organizationName}`, mailContent),
    );
    if (mailResponse.error) throw new Error(mailResponse.error.message);
    return mailResponse;
};

export const notifyOfMembershipApplication = async (
    parsedFieldValues: z.infer<typeof MembershipApplicationSchema>,
): Promise<void> => {
    const organizationSettings = await getOrganizationSettings();
    const mailContent = createElement(MembershipApplicationTemplate, {
        parsedFieldValues,
    });

    const transport = await getMailTransport();
    const mailResponse = await transport.sendMail(
        await getEmailPayload(
            [organizationSettings.organization_email],
            `New membership application received`,
            mailContent,
        ),
    );
    if (mailResponse.error) throw new Error(mailResponse.error.message);
};

/**
 * @throws Error if email fails
 */
export const remindExpiringMembers = async (userEmails: string[]): Promise<string> => {
    const orgSettings = await getOrganizationSettings();
    const mailContent = createElement(MembershipExpiresReminderTemplate);
    const transport = await getMailTransport();
    const mailResponse = await transport.sendMail(
        await getEmailPayload(
            userEmails,
            `Your ${orgSettings?.organization_name || "Task Master"} membership is about to expire`,
            mailContent,
        ),
    );
    if (mailResponse.error) throw new Error(mailResponse.error.message);
    return mailResponse;
};

/**
 * @throws Error if email fails
 */
export const notifyEventReserves = async (eventId: string): Promise<string> => {
    const reserveEmails = await getEventReservesEmails(eventId);
    if (reserveEmails.length === 0) return;

    const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
    const mailContent = createElement(OpenEventSpotTemplate, {
        event,
    });

    const transport = await getMailTransport();
    const mailResponse = await transport.sendMail(
        await getEmailPayload(
            reserveEmails,
            `A spot has opened up for the event: ${event.title}`,
            mailContent,
        ),
    );
    if (mailResponse.error) throw new Error(mailResponse.error.message);
    return mailResponse;
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

    const mailPayload = await getEmailPayload(
        [...participantEmails, ...reserveEmails],
        `Cancelled event: ${event.title}`,
        mailContent,
    );
    const transport = await getMailTransport();
    const mailResponse = await transport.sendMail(mailPayload);
    if (mailResponse.error) throw new Error(mailResponse.error.message);
    const rejectedEmails = mailResponse?.rejected;
    if (rejectedEmails.length > 0)
        throw new Error(
            `Failed to inform ${rejectedEmails.length} participants and reserves of cancelled event: ${rejectedEmails.join("\n")}`,
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
export const sendMassEmail = async (
    recipientCriteria: Prisma.UserWhereInput,
    formData: FormData,
): Promise<{
    accepted: number;
    rejected: number;
}> => {
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

    const mailContent = createElement(MailTemplate, {
        html: sanitizedContent.content,
    });
    const mailPayload = await getEmailPayload(recipients, sanitizedContent.subject, mailContent);
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
export const sendEmailNotification = async (
    recipient: string,
    subject: string,
    message: string,
    linkButtons: MailButtonLink[],
): Promise<{
    accepted: number;
    rejected: number;
}> => {
    const mailContent = createElement(EmailNotificationTemplate, {
        message,
        linkButtons,
    });
    const mailPayload = await getEmailPayload([recipient], subject, mailContent);
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
export const sendOrderConfirmation = async (orderId: string): Promise<string> => {
    // Fetch order details with items, products, and user email
    const orderDetails = await prisma.order.findUniqueOrThrow({
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
    const mailContent = createElement(OrderConfirmationTemplate, {
        orderId: orderDetails.id,
        orderItems: orderDetails.order_items,
        totalAmount: orderDetails.total_amount,
    });

    const transport = await getMailTransport();
    const mailResponse = await transport.sendMail(
        await getEmailPayload(
            [orderDetails.user.email],
            `Order Confirmation - ${await getOrganizationName()}`,
            mailContent,
        ),
    );

    if (mailResponse.error) throw new Error(mailResponse.error.message);
    return mailResponse;
};

export const notifyTaskReviewer = async (
    reviewerEmail: string,
    taskName: string,
    notificationMessage: string,
) => {
    const mailContent = createElement(TaskUpdateTemplate, {
        taskName,
        notificationMessage,
    });

    const transport = await getMailTransport();
    return transport.sendMail(await getEmailPayload([reviewerEmail], `Task updated`, mailContent));
};

export const memberContactMember = async (
    recipientEmail: string,
    senderEmail: string,
    subject: string,
    reason: string,
    content: string,
) => {
    // Import sanitizeRichText since we need to sanitize individual field
    const { sanitizeRichText } = await import("../html-sanitizer");
    const sanitizedContent = sanitizeRichText(content);

    const mailContent = createElement(MemberContactMemberTemplate, {
        reason,
        content: sanitizedContent,
    });

    const transport = await getMailTransport();
    // Set replyTo to the sender so the recipient can reply directly to the member
    return transport.sendMail(
        await getEmailPayload([recipientEmail], subject, mailContent, senderEmail),
    );
};

export const notifyOfValidatedMembership = async (userEmail: string) => {
    const mailContent = createElement(MailTemplate, {
        html: `Your membership has been validated. You can now log in and access member features.`,
    });
    const transport = await getMailTransport();
    return transport.sendMail(
        await getEmailPayload([userEmail], `Your membership has been validated`, mailContent),
    );
};
