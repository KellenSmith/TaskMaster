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
export const informOfCancelledEvent = async (eventId: string): Promise<string[]> => {
    const newActionState: FormActionState = { ...defaultFormActionState };
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
        const event = await prisma.event.findUniqueOrThrow({
            where: { id: eventId },
            select: { id: true, title: true, fullTicketPrice: true },
        });
        const mailContent = createElement(EventCancelledTemplate, {
            event: event,
            organizationName: await getOrganizationName(),
            organizationEmail:
                (await getOrganizationSettings())?.email || "<kellensmith407@gmail.com>",
        });

        const mailPayload = await getEmailPayload(
            participantEmails,
            `Event ${event.title} cancelled`,
            mailContent,
        );
        const mailResponse = await mailTransport.sendMail(mailPayload);
        if (mailResponse.error) throw new Error(mailResponse.error.message);
        newActionState.status = 200;
        newActionState.errorMsg = "";
        newActionState.result = `Sendout successful. Accepted: ${mailResponse?.accepted?.length}, rejected: ${mailResponse?.rejected?.length}`;
    } catch (error) {
        console.error("Failed to fetch participant emails:", error);
        return [];
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
    currentActionState: FormActionState,
    fieldValues: any,
): Promise<FormActionState> => {
    const newActionState = { ...currentActionState };
    try {
        const recipients = (
            await prisma.user.findMany({
                where: fieldValues[GlobalConstants.RECIPIENT_CRITERIA],
                select: {
                    email: true,
                },
            })
        ).map((user) => user.email);
        const mailContent = createElement(MailTemplate, {
            html: fieldValues[GlobalConstants.CONTENT],
            organizationName: await getOrganizationName(),
        });
        const mailPayload = await getEmailPayload(
            recipients,
            fieldValues[GlobalConstants.SUBJECT],
            mailContent,
        );

        const mailResponse = await mailTransport.sendMail(mailPayload);
        if (mailResponse.error) throw new Error(mailResponse.error.message);
        newActionState.status = 200;
        newActionState.errorMsg = "";
        newActionState.result = `Sendout successful. Accepted: ${mailResponse?.accepted?.length}, rejected: ${mailResponse?.rejected?.length}`;
    } catch {
        newActionState.status = 500;
        newActionState.errorMsg = "Failed to send mass email";
        newActionState.result = "";
    }
    return newActionState;
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
