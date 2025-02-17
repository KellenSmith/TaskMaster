// TODO: Change this HTML to React components

import GlobalConstants from "../../GlobalConstants";
import { OrgSettings } from "../org-settings";

export const userCredentialsTemplate = (
  userEmail: string,
  userPassword: string
): string => {
  return `
    <html>
    <head>
      <title>Here are your TaskMaster credentials</title>
    </head>
    <body>
      <p>
        Email: ${userEmail} <br/>
        Password: ${userPassword}
      </p>
    </body>
  </html>
    `;
};

export const membershipExpiresReminderTemplate = (): string => {
  return `
    <html>
    <head>
      <title>Membership expiring</title>
    </head>
    <body>
      <p>
        Your membership expires in ${
          OrgSettings[GlobalConstants.MEMBERSHIP_EXPIRES_REMINDER]
        } days. Renew it in the application.
      </p>
    </body>
  </html>
    `;
};
