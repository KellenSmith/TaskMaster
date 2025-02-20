"use server";

import GlobalConstants from "../../GlobalConstants";
import { OrgSettings } from "../org-settings";
import { resend } from "./resend-client";
import Resend from "resend";
import { membershipExpiresReminderTemplate, userCredentialsTemplate } from "./templates";

interface EmailPayload {
    from: string;
    to: string;
    subject: string;
    html: string;
}

const getEmailPayload = (toEmail: string, subject: string, htmlTemplate: string): EmailPayload => ({
    from: OrgSettings[GlobalConstants.ORG_NOREPLY_EMAIL] as string,
    to: "kellensmith407@gmail.com", // TODO: toEmail,
    subject: subject,
    html: htmlTemplate,
    // TODO: react: ...
});

/**
 * @throws Error if email fails
 */
export const sendUserCredentials = async (
    userEmail: string,
    userPassword: string,
): Promise<Resend.CreateEmailResponse> => {
    const mailResponse = await resend.emails.send(
        getEmailPayload(
            userEmail,
            "TaskMaster credentials",
            userCredentialsTemplate(userEmail, userPassword),
        ),
    );
    if (mailResponse.error) throw new Error(mailResponse.error.message);
    return mailResponse;
};

export const remindExpiringMembers = async (
    userEmails: string[],
): Promise<Resend.CreateBatchResponse> => {
    const batchMailResponse = await resend.batch.send(
        userEmails.map((userEmail) =>
            getEmailPayload(
                userEmail,
                "Your membership is about to expire",
                membershipExpiresReminderTemplate(),
            ),
        ),
    );
    if (batchMailResponse.error) throw new Error(batchMailResponse.error.message);
    return batchMailResponse;
};
