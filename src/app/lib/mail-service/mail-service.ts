"use server";

import { mailTransport } from "./mail-transport";
import UserCredentialsTemplate from "./mail-templates/UserCredentialsTemplate";
import { createElement, ReactElement } from "react";
import MembershipExpiresReminderTemplate from "./mail-templates/MembershipExpiresReminderTemplate";
import { render } from "@react-email/components";

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
    from: `${process.env.NEXT_PUBLIC_ORG_NAME} <${process.env.NOREPLY_EMAIL}>`,
    bcc: "kellensmith407@gmail.com", // TODO: receivers.join(", ")
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
        await getEmailPayload([userEmail], "TaskMaster credentials", mailContent),
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
                    "Your membership is about to expire",
                    mailContent,
                ),
        ),
    );
    if (mailResponse.error) throw new Error(mailResponse.error.message);
    return mailResponse;
};
