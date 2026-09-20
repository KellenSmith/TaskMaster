"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { deleteUser, logOut, updateUser } from "../../lib/user-actions";
import { Stack } from "@mui/material";
import ConfirmButton from "../../ui/ConfirmButton";
import { allowRedirectException } from "../../ui/utils";
import { useNotificationContext } from "../../context/NotificationContext";
import { UserUpdateSchema } from "../../lib/zod-schemas";
import { useTransition } from "react";
import { LoadingFallback } from "../../ui/ErrorBoundarySuspense";
import MembershipStatusCard from "./MembershipStatusCard";
import RenewMembershipButton from "../../ui/RenewMembershipButton";
import { useMembershipState } from "../../lib/use-membership-state";
import { MembershipState } from "../../lib/membership-utils";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import LanguageTranslations from "./LanguageTranslations";
import { Prisma } from "../../../prisma/generated/browser";

interface AccountTabProps {
    membershipProductPromise: Promise<Prisma.ProductGetPayload<{ select: { name: true } }> | null>;
}

const AccountTab = ({ membershipProductPromise }: AccountTabProps) => {
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();
    const { state: membershipState } = useMembershipState();

    if (!user) return <LoadingFallback />;

    const updateUserProfile = async (formData: FormData) => {
        try {
            await updateUser(user.id, formData);
            return GlobalLanguageTranslations.successfulSave[language];
        } catch {
            throw new Error(GlobalLanguageTranslations.failedSave[language]);
        }
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

    // Blacklisted and not-yet-approved members have nothing to click here.
    const canStartRenewal =
        membershipState !== MembershipState.anonymous &&
        membershipState !== MembershipState.blacklisted &&
        membershipState !== MembershipState.awaitingValidation;

    return (
        <Stack>
            <MembershipStatusCard membershipProductPromise={membershipProductPromise} />
            {canStartRenewal && (
                <RenewMembershipButton state={membershipState} disabled={isPending} />
            )}
            <Form
                name={GlobalConstants.PROFILE}
                buttonLabel={GlobalLanguageTranslations.save[language]}
                action={updateUserProfile}
                validationSchema={UserUpdateSchema}
                defaultValues={user}
            ></Form>

            <ConfirmButton
                buttonProps={{
                    color: "error",
                    disabled: isPending,
                }}
                onClick={deleteMyAccount}
            >
                {LanguageTranslations.deleteAccount[language]}
            </ConfirmButton>
        </Stack>
    );
};

export default AccountTab;
