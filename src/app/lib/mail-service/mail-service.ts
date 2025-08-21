"use server";

import { mailTransport } from "./mail-transport";
import UserCredentialsTemplate from "./mail-templates/UserCredentialsTemplate";
import { createElement, ReactElement } from "react";
import MembershipExpiresReminderTemplate from "./mail-templates/MembershipExpiresReminderTemplate";
import { render } from "@react-email/components";
import MailTemplate from "./mail-templates/MailTemplate";
import { prisma } from "../../../prisma/prisma-client";
import { Prisma } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";
import EventCancelledTemplate from "./mail-templates/EventCancelledTemplate";
import OrderConfirmationTemplate from "./mail-templates/OrderConfirmationTemplate";
import { defaultFormActionState, FormActionState } from "../definitions";
import { getOrganizationName, getOrganizationSettings } from "../organization-settings-actions";
import { EmailSendoutSchema } from "../zod-schemas";
import z from "zod";

interface EmailPayload {
    from: string;
    bcc: string;
    subject: string;
    html: string;
}

const getEmailPayload = async (
    receivers: string[],
    subject: string,
    mailContent: ReactElement,
): Promise<EmailPayload> => {
    const organizationSettings = await getOrganizationSettings();
    return {
        from: `${await getOrganizationName()} <${organizationSettings?.email}>`,
        bcc: receivers.join(", "),
        subject: subject,
        html: await render(mailContent),
    };
};

/**
 * @throws Error if email fails
 */
export const sendUserCredentials = async (
    userEmail: string,
    userPassword: string,
): Promise<string> => {
    const mailContent = createElement(UserCredentialsTemplate, {
        userEmail: userEmail,
        password: userPassword,
        organizationName: await getOrganizationName(),
    });
    const mailResponse = await mailTransport.sendMail(
        await getEmailPayload(
            [userEmail],
            `${await getOrganizationName()} credentials`,
            mailContent,
        ),
    );
    if (mailResponse.error) throw new Error(mailResponse.error.message);
    return mailResponse;
};

/**
 * @throws Error if email fails
 */
export const remindExpiringMembers = async (userEmails: string[]): Promise<string> => {
    const orgSettings = await getOrganizationSettings();
    const mailContent = createElement(MembershipExpiresReminderTemplate, {
        organizationSettings: orgSettings,
    });
    const mailResponse = await mailTransport.sendMail(
        userEmails.map(
            async (userEmail) =>
                await getEmailPayload(
                    [userEmail],
                    `Your ${orgSettings?.organizationName || "Task Master"} membership is about to expire`,
                    mailContent,
                ),
        ),
    );
    if (mailResponse.error) throw new Error(mailResponse.error.message);
    return mailResponse;
};

/**
 * @throws Error if email fails
 */
export const informOfCancelledEvent = async (eventId: string): Promise<void> => {
    try {
        const participantEmails = (
            await prisma.participantInEvent.findMany({
                where: { eventId },
                select: {
                    User: {
                        select: {
                            email: true,
                        },
                    },
                },
            })
        ).map((participant) => participant.User.email);
        const reservesEmails = (
            await prisma.reserveInEvent.findMany({
                where: { eventId },
                select: {
                    User: {
                        select: {
                            email: true,
                        },
                    },
                },
            })
        ).map((reserve) => reserve.User.email);
        const event = await prisma.event.findUniqueOrThrow({
            where: { id: eventId },
            select: { id: true, title: true },
        });
        const mailContent = createElement(EventCancelledTemplate, {
            event: event,
            organizationName: await getOrganizationName(),
        });

        const mailPayload = await getEmailPayload(
            [...participantEmails, ...reservesEmails],
            `Event ${event.title} cancelled`,
            mailContent,
        );
        const mailResponse = await mailTransport.sendMail(mailPayload);
        if (mailResponse.error) throw new Error(mailResponse.error.message);
        const rejectedEmails = mailResponse?.rejected;
        if (rejectedEmails.length > 0)
            throw new Error(
                `Failed to inform ${rejectedEmails.length} participants and reserves of cancelled event: ${rejectedEmails.join("\n")}`,
            );
    } catch (error) {
        throw new Error(`Failed to inform participants and reserves of cancelled event`);
    }
};

export const getEmailRecipientCount = async (
    recipientCriteria: Prisma.UserWhereInput,
): Promise<number> => {
    try {
        const recipientCount = await prisma.user.count({
            where: recipientCriteria,
        });
        return recipientCount;
    } catch {
        return 0;
    }
};

/**
 * @throws Error if email fails
 */
export const sendMassEmail = async (
    recipientCriteria: Prisma.UserWhereInput,
    parsedFieldValues: z.infer<typeof EmailSendoutSchema>,
): Promise<string> => {
    try {
        const recipients = (
            await prisma.user.findMany({
                where: recipientCriteria,
                select: {
                    email: true,
                },
            })
        ).map((user) => user.email);
        const mailContent = createElement(MailTemplate, {
            html: parsedFieldValues.content,
            organizationName: await getOrganizationName(),
        });
        const mailPayload = await getEmailPayload(
            recipients,
            parsedFieldValues.subject,
            mailContent,
        );

        const mailResponse = await mailTransport.sendMail(mailPayload);
        if (mailResponse.error) throw new Error(mailResponse.error.message);
        return `Sendout successful. Accepted: ${mailResponse?.accepted?.length}, rejected: ${mailResponse?.rejected?.length}`;
    } catch {
        throw new Error("Failed to send mass email");
    }
};

/**
 * @throws Error if email fails
 */
export const sendOrderConfirmation = async (orderId: string): Promise<string> => {
    try {
        // Fetch order details with items, products, and user email
        const orderDetails = await prisma.order.findUniqueOrThrow({
            where: { id: orderId },
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
                orderItems: {
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
            orderItems: orderDetails.orderItems,
            totalAmount: orderDetails.totalAmount,
            organizationName: await getOrganizationName(),
        });

        const mailResponse = await mailTransport.sendMail(
            await getEmailPayload(
                [orderDetails.user.email],
                `Order Confirmation - ${await getOrganizationName()}`,
                mailContent,
            ),
        );

        if (mailResponse.error) throw new Error(mailResponse.error.message);
        return mailResponse;
    } catch (error) {
        console.error(`Failed to send order confirmation email for order ${orderId}: `, error);
    }
};
