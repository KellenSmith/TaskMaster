"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { deleteUser, logOut, updateUser } from "../../lib/user-actions";
import { Button, Stack } from "@mui/material";
import ConfirmButton from "../../ui/ConfirmButton";
import { allowRedirectException, userHasActiveMembershipSubscription } from "../../ui/utils";
import { useNotificationContext } from "../../context/NotificationContext";
import { UserUpdateSchema } from "../../lib/zod-schemas";
import { useTransition } from "react";
import { LoadingFallback } from "../../ui/ErrorBoundarySuspense";
import MembershipStatusCard from "./MembershipStatusCard";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import LanguageTranslations from "./LanguageTranslations";
import { UserStatus } from "@prisma/client";
import { clientRedirect, isMembershipExpired } from "../../lib/utils";
import { useRouter } from "next/navigation";
import {
    cancelMembershipSubscription,
    startMembershipSubscription,
} from "../../lib/user-membership-actions";

const AccountTab = () => {
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    if (!user) return <LoadingFallback />;

    const updateUserProfile = async (formData: FormData) => {
        await updateUser(user.id, formData);
        return GlobalLanguageTranslations.successfulSave[language];
    };

    const deleteMyAccount = async () =>
        startTransition(async () => {
            try {
                await deleteUser(user.id);
                await logOut();
            } catch (error) {
                allowRedirectException(error);
                addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
            }
        });

    const startMembershipSubscriptionAction = () => {
        startTransition(async () => {
            try {
                await startMembershipSubscription(user.id);
            } catch (error) {
                allowRedirectException(error);
                addNotification(LanguageTranslations.failedActivateMembership[language], "error");
            }
        });
    };

    const cancelSubscriptionAction = async () => {
        startTransition(async () => {
            try {
                await cancelMembershipSubscription(user.id);
                addNotification(LanguageTranslations.cancelledSubscription[language], "success");
            } catch (error) {
                addNotification(LanguageTranslations.failedCancelSubscription[language], "error");
            }
        });
    };

    const getMembershipActionButton = () => {
        if (userHasActiveMembershipSubscription(user))
            return (
                <ConfirmButton
                    color="error"
                    onClick={cancelSubscriptionAction}
                    disabled={isPending}
                >
                    {LanguageTranslations.cancelSubscription[language]}
                </ConfirmButton>
            );
        if (user.status !== UserStatus.validated) return null;

        const ActivateMembershipButton = (
            <Button
                onClick={() => clientRedirect(router, [GlobalConstants.SHOP])}
                disabled={isPending}
            >
                {LanguageTranslations.activateMembership[language](user)}
            </Button>
        );
        if (isMembershipExpired(user)) return ActivateMembershipButton;
        return (
            <>
                {ActivateMembershipButton}
                <ConfirmButton
                    color="success"
                    onClick={startMembershipSubscriptionAction}
                    disabled={isPending}
                >
                    {LanguageTranslations.startMembershipSubscription[language]}
                </ConfirmButton>
            </>
        );
    };

    return (
        <Stack>
            <MembershipStatusCard />
            {getMembershipActionButton()}
            <Form
                name={GlobalConstants.PROFILE}
                buttonLabel={GlobalLanguageTranslations.save[language]}
                action={updateUserProfile}
                validationSchema={UserUpdateSchema}
                defaultValues={user}
            ></Form>

            <ConfirmButton color="error" onClick={deleteMyAccount} disabled={isPending}>
                {LanguageTranslations.deleteAccount[language]}
            </ConfirmButton>
        </Stack>
    );
};

export default AccountTab;
