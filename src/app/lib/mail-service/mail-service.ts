"use server";

import GlobalConstants from "../../GlobalConstants";
import { OrgSettings } from "../org-settings";
import { resend } from "./resend-client";
import Resend from "resend";
import { userCredentialsTemplate } from "./templates";

/**
 * @throws Error if email fails
 */
export const sendUserCredentials = async (
  userEmail: string,
  userPassword: string
): Promise<Resend.CreateEmailResponse> => {
  const mailResponse = await resend.emails.send({
    from: OrgSettings[GlobalConstants.ORG_NOREPLY_EMAIL] as string,
    to: userEmail,
    subject: "TaskMaster credentials",
    html: userCredentialsTemplate(userEmail, userPassword),
    // TODO: react: ...
  });
  if (!!mailResponse.error) throw new Error(mailResponse.error.message);
  return mailResponse;
};
