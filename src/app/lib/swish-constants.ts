import GlobalConstants from "../GlobalConstants";
import { OrgSettings } from "./org-settings";

export const SwishConstants = {
    PENDING: "PENDING",
    PAID: "PAID",
    EXPIRED: "EXPIRED",
    ERROR: "ERROR",
    CALLBACK_URL: `${OrgSettings[GlobalConstants.BASE_URL]}/api/swish`,
};
