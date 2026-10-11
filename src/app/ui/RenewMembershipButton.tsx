"use client";

import { Button, ButtonProps } from "@mui/material";
import { useState, useTransition } from "react";
import { startMembershipRenewal } from "../lib/membership-actions";
import { allowRedirectException } from "./utils";
import { useNotificationContext } from "../context/NotificationContext";
import { useUserContext } from "../context/UserContext";
import {
    MembershipProduct,
    useMembershipProductsContext,
} from "../context/MembershipProductsContext";
import LanguageTranslations from "../lib/membership-language-translations";
import { MembershipState, MembershipStateType } from "../lib/membership-utils";
import MembershipTierDialog from "./MembershipTierDialog";

interface RenewMembershipButtonProps extends ButtonProps {
    state: MembershipStateType;
}

/**
 * Starts a membership renewal and sends the user to checkout.
 * With a single membership product this is one click. With several, a dialog
 * asks which tier to renew into, preselecting the member's current one.
 * Shared by every surface that offers renewal so the call is implemented once.
 */
const RenewMembershipButton = ({ state, ...buttonProps }: RenewMembershipButtonProps) => {
    const { user, language } = useUserContext();
    const { membershipProductsPromise } = useMembershipProductsContext();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();
    const [tierChoice, setTierChoice] = useState<MembershipProduct[] | null>(null);
    const [selectedProductId, setSelectedProductId] = useState("");

    const currentProductId = user?.user_membership?.membership_id ?? null;

    const label =
        state === MembershipState.awaitingPayment
            ? LanguageTranslations.activateMembership[language]
            : LanguageTranslations.renewMembership[language];

    const renew = (productId?: string) =>
        startTransition(async () => {
            let errorMsg: string | undefined;
            try {
                errorMsg = await startMembershipRenewal(productId);
                if (!errorMsg) return;
            } catch (error) {
                allowRedirectException(error); // rethrows NEXT_REDIRECT
                errorMsg = LanguageTranslations.failedStartRenewal[language];
            }
            addNotification(errorMsg, "error");
        });

    const onClick = () =>
        startTransition(async () => {
            const products = await membershipProductsPromise;
            if (products.length <= 1) return renew();

            // Preselect the tier they hold today, else the first one offered
            const current = products.find((m) => m.product_id === currentProductId);
            setSelectedProductId((current ?? products[0]).product_id);
            setTierChoice(products);
        });

    const closeDialog = () => setTierChoice(null);

    const confirmTier = () => {
        closeDialog();
        renew(selectedProductId);
    };

    return (
        <>
            <Button
                variant="contained"
                color="warning"
                disabled={isPending}
                onClick={onClick}
                {...buttonProps}
            >
                {label}
            </Button>
            {tierChoice && (
                <MembershipTierDialog
                    open
                    products={tierChoice}
                    selectedProductId={selectedProductId}
                    currentProductId={currentProductId}
                    isPending={isPending}
                    onSelect={setSelectedProductId}
                    onConfirm={confirmTier}
                    onCancel={closeDialog}
                />
            )}
        </>
    );
};

export default RenewMembershipButton;
