"use client";

import { useUserContext } from "../context/UserContext";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { getDaysUntilExpiry, getMembershipState } from "./membership-utils";

/**
 * Client-side accessor for the shared membership state machine.
 * Every membership CTA in the app derives its behaviour from this.
 */
export const useMembershipState = () => {
    const { user } = useUserContext();
    const { organizationSettings } = useOrganizationSettingsContext();

    return {
        state: getMembershipState(user, organizationSettings?.remind_membership_expires_in_days),
        daysLeft: getDaysUntilExpiry(user),
        user,
    };
};
