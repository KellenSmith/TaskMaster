"use client";

import { Alert, AlertColor, Button, IconButton, Stack } from "@mui/material";
import { Close } from "@mui/icons-material";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import GlobalConstants from "../GlobalConstants";
import GlobalLanguageTranslations from "../GlobalLanguageTranslations";
import LanguageTranslations from "../lib/membership-language-translations";
import { MembershipState } from "../lib/membership-utils";
import { useMembershipState } from "../lib/use-membership-state";
import { useUserContext } from "../context/UserContext";
import { clientRedirect } from "../lib/utils";
import { formatUtcDateToTimezone } from "./utils";
import RenewMembershipButton from "./RenewMembershipButton";

// Mid-checkout, applying and logging in are the moments a nagging banner would only get in the way.
const HIDDEN_PATHS = [GlobalConstants.ORDER, GlobalConstants.APPLY, GlobalConstants.LOGIN].map(
    (route) => `/${route}`,
);

const isHiddenPath = (pathname: string | null) =>
    !!pathname &&
    HIDDEN_PATHS.some((hidden) => pathname === hidden || pathname.startsWith(`${hidden}/`));

const isProfilePath = (pathname: string | null) =>
    !!pathname && pathname.startsWith(`/${GlobalConstants.PROFILE}`);

interface BannerConfig {
    severity: AlertColor;
    message: string;
    action: ReactNode;
    dismissible: boolean;
}

/**
 * Sitewide membership status banner: the in-app counterpart to the expiry reminder email.
 * Renders nothing for members in good standing, anonymous visitors and blacklisted users.
 */
const MembershipBanner = () => {
    const { state, daysLeft, user } = useMembershipState();
    const { language } = useUserContext();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    // Start hidden so the server render and the first client render agree; the
    // effect reveals the banner once sessionStorage has been consulted.
    const [dismissed, setDismissed] = useState(true);

    const expiresAt = user?.user_membership?.expires_at;
    // Keyed on the expiry date so a dismissal does not survive into the next cycle.
    const storageKey = `membership-banner-dismissed:${
        expiresAt ? dayjs.utc(expiresAt).toISOString() : "none"
    }`;

    useEffect(() => {
        setDismissed(window.sessionStorage.getItem(storageKey) === "true");
    }, [storageKey]);

    const dismiss = () => {
        window.sessionStorage.setItem(storageKey, "true");
        setDismissed(true);
    };

    if (isHiddenPath(pathname)) return null;

    const redirectedForMembership =
        searchParams?.get(GlobalConstants.MEMBERSHIP_REQUIRED) === "true";
    const membershipRequiredPrefix = redirectedForMembership
        ? `${LanguageTranslations.pageRequiresMembership[language]} `
        : "";

    const renewButton = (
        <RenewMembershipButton state={state} size="small" variant="outlined" color="inherit" />
    );

    const getConfig = (): BannerConfig | null => {
        switch (state) {
            case MembershipState.expiringSoon:
                return {
                    severity: "warning",
                    message: `${LanguageTranslations.expiresInDays[language](daysLeft ?? 0)} (${formatUtcDateToTimezone(expiresAt!)}). ${LanguageTranslations.renewingExtendsFromExpiry[language]}`,
                    action: renewButton,
                    dismissible: true,
                };
            case MembershipState.expired:
                return {
                    severity: "error",
                    message: `${membershipRequiredPrefix}${LanguageTranslations.expiredOn[language](formatUtcDateToTimezone(expiresAt!))}. ${LanguageTranslations.renewToBookEvents[language]}`,
                    action: renewButton,
                    dismissible: false,
                };
            case MembershipState.awaitingPayment:
                return {
                    severity: "info",
                    message: `${membershipRequiredPrefix}${LanguageTranslations.approvedActivatePrompt[language]}`,
                    action: renewButton,
                    dismissible: false,
                };
            case MembershipState.awaitingValidation:
                return {
                    severity: "info",
                    message: LanguageTranslations.applicationUnderReview[language],
                    // Already on the profile page: nothing to navigate to.
                    action: isProfilePath(pathname) ? null : (
                        <Button
                            size="small"
                            color="inherit"
                            onClick={() => clientRedirect(router, [GlobalConstants.PROFILE])}
                        >
                            {LanguageTranslations.viewStatus[language]}
                        </Button>
                    ),
                    dismissible: true,
                };
            default:
                return null;
        }
    };

    const config = getConfig();
    if (!config) return null;
    if (config.dismissible && dismissed) return null;

    return (
        <Alert
            severity={config.severity}
            sx={{ mx: 4, mt: 2, alignItems: "center" }}
            action={
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    {config.action}
                    {config.dismissible && (
                        <IconButton
                            size="small"
                            color="inherit"
                            aria-label={GlobalLanguageTranslations.close[language]}
                            onClick={dismiss}
                        >
                            <Close fontSize="small" />
                        </IconButton>
                    )}
                </Stack>
            }
        >
            {config.message}
        </Alert>
    );
};

export default MembershipBanner;
