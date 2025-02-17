"use server";

import GlobalConstants from "../GlobalConstants";
import { OrgSettings } from "../lib/org-settings";
import { resend } from "./resend-client";

export const sendTestEmail = async () => {
  resend.emails.send({
    from: OrgSettings[GlobalConstants.ORG_NOREPLY_EMAIL] as string,
    to: "kellensmith407@gmail.com",
    subject: "Hello World",
    html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
  });
};
