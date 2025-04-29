"use server";

import { mailTransport } from "./mail-transport";
import UserCredentialsTemplate from "./mail-templates/UserCredentialsTemplate";
import { createElement, ReactElement } from "react";
import MembershipExpiresReminderTemplate from "./mail-templates/MembershipExpiresReminderTemplate";
import { render } from "@react-email/components";
import MailTemplate from "./mail-templates/MailTemplate";
import { prisma } from "../../../prisma/prisma-client";
import { Prisma } from "@prisma/client";
import { FormActionState } from "../../ui/form/Form";
import GlobalConstants from "../../GlobalConstants";

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
): Promise<EmailPayload> => ({
    from: `${process.env.NEXT_PUBLIC_ORG_NAME} <${process.env.EMAIL}>`,
    bcc: receivers.join(", "),
    subject: subject,
    html: await render(mailContent),
});

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
    });
    const mailResponse = await mailTransport.sendMail(
        await getEmailPayload(
            [userEmail],
            `${process.env.NEXT_PUBLIC_ORG_NAME} credentials`,
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
    const mailContent = createElement(MembershipExpiresReminderTemplate);
    const mailResponse = await mailTransport.sendMail(
        userEmails.map(
            async (userEmail) =>
                await getEmailPayload(
                    [userEmail],
                    `Your ${process.env.NEXT_PUBLIC_ORG_NAME} membership is about to expire`,
                    mailContent,
                ),
        ),
    );
    if (mailResponse.error) throw new Error(mailResponse.error.message);
    return mailResponse;
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
