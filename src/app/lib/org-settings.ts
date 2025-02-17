/**
 * Settings pertaining to the organization
 */

import GlobalConstants from "../GlobalConstants";

export const OrgSettings = {
  [GlobalConstants.MEMBERSHIP_DURATION]: 365, // days
  [GlobalConstants.COOKIE_LIFESPAN]: 1, //days
  [GlobalConstants.PURGE_STALE_APPLICATIONS]: Math.floor(365 / 2), // days (6 months)
  [GlobalConstants.ORG_NOREPLY_EMAIL]: "onboarding@resend.dev",
  [GlobalConstants.ORG_REPLY_EMAIL]: "onboarding@resend.dev",
};
