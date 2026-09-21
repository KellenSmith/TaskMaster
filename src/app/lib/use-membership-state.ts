"use client";

import { useUserContext } from "../context/UserContext";
import { useOrganizationSettingsContext } from "../context/OrganizationSettingsContext";
import { getDaysUntilExpiry, getMembershipState } from "./membership-utils";

/**
 * Single source of truth for "what state is the logged-in user's membership in".
 * Derives the state from UserContext and OrganizationSettingsContext.
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
