"use client";

import { Button, ButtonProps } from "@mui/material";
import { useTransition } from "react";
import { startMembershipRenewal } from "../lib/membership-actions";
import { allowRedirectException } from "./utils";
import { useNotificationContext } from "../context/NotificationContext";
import { useUserContext } from "../context/UserContext";
import LanguageTranslations from "../lib/membership-language-translations";
import { MembershipState, MembershipStateType } from "../lib/membership-utils";

interface RenewMembershipButtonProps extends ButtonProps {
    state: MembershipStateType;
}

/**
 * Starts a membership renewal and sends the user to checkout.
 * Shared by every surface that offers renewal so the call is implemented once.
 */
const RenewMembershipButton = ({ state, ...buttonProps }: RenewMembershipButtonProps) => {
    const { language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();

    const label =
        state === MembershipState.awaitingPayment
            ? LanguageTranslations.activateMembership[language]
            : LanguageTranslations.renewMembership[language];

    const onClick = () =>
        startTransition(async () => {
            let errorMsg: string | undefined;
            try {
                errorMsg = await startMembershipRenewal();
                if (!errorMsg) return;
            } catch (error) {
                allowRedirectException(error); // rethrows NEXT_REDIRECT
                errorMsg = LanguageTranslations.failedStartRenewal[language];
            }
            addNotification(errorMsg, "error");
        });

    return (
        <Button
            variant="contained"
            color="warning"
            disabled={isPending}
            onClick={onClick}
            {...buttonProps}
        >
            {label}
        </Button>
    );
};

export default RenewMembershipButton;
