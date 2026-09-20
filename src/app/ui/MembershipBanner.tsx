"use client";

import { Alert, AlertColor, Button, IconButton, Stack } from "@mui/material";
import { Close } from "@mui/icons-material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import GlobalConstants from "../GlobalConstants";
import { useUserContext } from "../context/UserContext";
import { useMembershipState } from "../lib/use-membership-state";
import { MembershipState } from "../lib/membership-utils";
import LanguageTranslations from "../lib/membership-language-translations";
import RenewMembershipButton from "./RenewMembershipButton";
import { formatUtcDateToTimezone } from "./utils";

// Pages where the banner would get in the way of what the user is already doing
const HIDDEN_PATHS = [GlobalConstants.ORDER, GlobalConstants.APPLY, GlobalConstants.LOGIN].map(
    (path) => `/${path}`,
);

const PROFILE_PATH = `/${GlobalConstants.PROFILE}`;

export const getDismissalKey = (expiresAt: Date | string | null | undefined) =>
    `membership-banner-dismissed:${expiresAt ? new Date(expiresAt).toISOString() : "none"}`;

/**
 * Site-wide membership status banner. Warns members before their membership
 * lapses, tells lapsed members why they are locked out, and nudges approved
 * applicants to pay. Renders nothing for active, anonymous and blacklisted users.
 */
const MembershipBanner = () => {
    const { language } = useUserContext();
    const { state, daysLeft, user } = useMembershipState();
    const pathname = usePathname();
    // Start dismissed so nothing flashes before sessionStorage has been read
    const [dismissed, setDismissed] = useState(true);

    // Keyed on the expiry date so the banner comes back for the next membership period
    const dismissalKey = getDismissalKey(user?.user_membership?.expires_at);
    useEffect(() => {
        setDismissed(sessionStorage.getItem(dismissalKey) === "true");
    }, [dismissalKey]);

    const dismiss = () => {
        sessionStorage.setItem(dismissalKey, "true");
        setDismissed(true);
    };

    if (HIDDEN_PATHS.some((path) => pathname?.startsWith(path))) return null;

    let severity: AlertColor;
    let message: string;
    let action: ReactNode;
    let dismissible: boolean;

    const expiresAt = user?.user_membership
        ? formatUtcDateToTimezone(user.user_membership.expires_at)
        : "";

    switch (state) {
        case MembershipState.expiringSoon:
            severity = "warning";
            message = LanguageTranslations.bannerExpiringSoon[language](daysLeft ?? 0, expiresAt);
            action = <RenewMembershipButton state={state} size="small" />;
            dismissible = true;
            break;
        case MembershipState.expired:
            severity = "error";
            message = LanguageTranslations.bannerExpired[language](expiresAt);
            action = <RenewMembershipButton state={state} size="small" />;
            dismissible = false;
            break;
        case MembershipState.awaitingPayment:
            severity = "info";
            message = LanguageTranslations.bannerAwaitingPayment[language];
            action = <RenewMembershipButton state={state} size="small" />;
            dismissible = false;
            break;
        case MembershipState.awaitingValidation:
            severity = "info";
            message = LanguageTranslations.bannerAwaitingValidation[language];
            action = pathname?.startsWith(PROFILE_PATH) ? null : (
                <Button component={Link} href={PROFILE_PATH} size="small" color="inherit">
                    {LanguageTranslations.viewStatus[language]}
                </Button>
            );
            dismissible = true;
            break;
        default:
            // active, anonymous, blacklisted
            return null;
    }

    if (dismissible && dismissed) return null;

    return (
        <Alert
            severity={severity}
            sx={{ borderRadius: 0, alignItems: "center" }}
            action={
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    {action}
                    {dismissible && (
                        <IconButton
                            size="small"
                            color="inherit"
                            aria-label={LanguageTranslations.dismiss[language]}
                            onClick={dismiss}
                        >
                            <Close fontSize="small" />
                        </IconButton>
                    )}
                </Stack>
            }
        >
            {message}
        </Alert>
    );
};

export default MembershipBanner;
