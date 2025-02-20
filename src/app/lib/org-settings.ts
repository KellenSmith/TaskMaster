/**
 * Settings pertaining to the organization
 */

import GlobalConstants from "../GlobalConstants";

export const OrgSettings = {
    [GlobalConstants.ORG_NAME]: "Kellen Smith",
    [GlobalConstants.BASE_URL]: "https://localhost:3000",
    [GlobalConstants.MEMBERSHIP_DURATION]: 365, // days
    [GlobalConstants.MEMBERSHIP_FEE]: 150,
    [GlobalConstants.COOKIE_LIFESPAN]: 1, //days
    [GlobalConstants.PURGE_STALE_APPLICATIONS]: Math.floor(365 / 2), // days (6 months)
    [GlobalConstants.ORG_NOREPLY_EMAIL]: "onboarding@resend.dev",
    [GlobalConstants.ORG_REPLY_EMAIL]: "onboarding@resend.dev",
    [GlobalConstants.MEMBERSHIP_EXPIRES_REMINDER]: 7, // days
    // Swish
    [GlobalConstants.SWISH_BASE_URL]: "https://mss.cpc.getswish.net/swish-cpcapi/api/v2/",
    [GlobalConstants.SWISH_MSS_URL]: "https://mss.cpc.getswish.net/swish-cpcapi/api/v2/",
    [GlobalConstants.SWISH_CALLBACK_URL]: "https://example.com/api/swishcb/",
    [GlobalConstants.SWISH_PAYEE_ALIAS]: "1234679304",
    [GlobalConstants.SWISH_QR_CODE_SIZE]: 300,
};
