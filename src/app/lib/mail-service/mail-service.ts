"use server";

import { resend } from "./resend-client";
import Resend from "resend";
import UserCredentialsTemplate from "./mail-templates/UserCredentialsTemplate";
import { ReactNode } from "react";
import MembershipExpiresReminderTemplate from "./mail-templates/MembershipExpiresReminderTemplate";

interface EmailPayload {
    from: string;
    to: string;
    subject: string;
    react: ReactNode;
}

const getEmailPayload = (
    toEmail: string,
    subject: string,
    mailContent: ReactNode,
): EmailPayload => ({
    from: process.env.NOREPLY_EMAIL,
    to: "kellensmith407@gmail.com", // TODO: toEmail,
    subject: subject,
    react: mailContent,
});

/**
 * @throws Error if email fails
 */
export const sendUserCredentials = async (
    userEmail: string,
    userPassword: string,
): Promise<Resend.CreateEmailResponse> => {
    const mailContent = await UserCredentialsTemplate({
        userEmail: userEmail,
        password: userPassword,
    });
    const mailResponse = await resend.emails.send(
        getEmailPayload(userEmail, "TaskMaster credentials", mailContent),
    );
    if (mailResponse.error) throw new Error(mailResponse.error.message);
    return mailResponse;
};

/**
 * @throws Error if email fails
 */
export const remindExpiringMembers = async (
    userEmails: string[],
): Promise<Resend.CreateBatchResponse> => {
    const mailContent = await MembershipExpiresReminderTemplate();
    const batchMailResponse = await resend.batch.send(
        userEmails.map((userEmail) =>
            getEmailPayload(userEmail, "Your membership is about to expire", mailContent),
        ),
    );
    if (batchMailResponse.error) throw new Error(batchMailResponse.error.message);
    return batchMailResponse;
};
