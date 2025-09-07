"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { deleteUser, logOut, updateUser } from "../../lib/user-actions";
import { Button, Stack } from "@mui/material";
import ConfirmButton from "../../ui/ConfirmButton";
import { allowRedirectException } from "../../ui/utils";
import { useNotificationContext } from "../../context/NotificationContext";
import { UserUpdateSchema } from "../../lib/zod-schemas";
import { createMembershipOrder } from "../../lib/user-membership-actions";
import z from "zod";
import { useTransition } from "react";
import { LoadingFallback } from "../../ui/ErrorBoundarySuspense";
import MembershipStatusCard from "./MembershipStatusCard";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import LanguageTranslations from "./LanguageTranslations";
import { UserStatus } from "@prisma/client";

const AccountTab = () => {
    const { user, language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();

    if (!user) return <LoadingFallback />;

    const updateUserProfile = async (parsedFieldValues: z.infer<typeof UserUpdateSchema>) => {
        await updateUser(user.id, parsedFieldValues);
        return GlobalLanguageTranslations.successfulSave[language];
    };

    const deleteMyAccount = async () =>
        startTransition(async () => {
            try {
                await deleteUser(user.id);
                await logOut();
            } catch {
                addNotification(GlobalLanguageTranslations.failedDelete[language], "error");
            }
        });

    const activateMembership = async () =>
        startTransition(async () => {
            try {
                await createMembershipOrder(user.id);
            } catch (error) {
                allowRedirectException(error);
                // Show notification for all other errors
                addNotification(LanguageTranslations.failedActivateMembership[language], "error");
            }
        });

    return (
        <Stack>
            <MembershipStatusCard />
            {user.status === UserStatus.validated && (
                <Button onClick={activateMembership} disabled={isPending}>
                    {LanguageTranslations.activateMembership[language](user)}
                </Button>
            )}
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
