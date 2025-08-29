"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { deleteUser, updateUser } from "../../lib/user-actions";
import { Button, Stack } from "@mui/material";
import { clientRedirect } from "../../lib/definitions";
import ConfirmButton from "../../ui/ConfirmButton";
import { allowRedirectException } from "../../ui/utils";
import { useRouter } from "next/navigation";
import { signOut } from "../../lib/auth";
import { useNotificationContext } from "../../context/NotificationContext";
import { UpdateCredentialsSchema, UserUpdateSchema } from "../../lib/zod-schemas";
import { updateUserCredentials } from "../../lib/user-credentials-actions";
import { createMembershipOrder } from "../../lib/user-membership-actions";
import z from "zod";
import { useTransition } from "react";
import { LoadingFallback } from "../../ui/ErrorBoundarySuspense";
import MembershipStatusCard from "./MembershipStatusCard";
import GlobalLanguageTranslations from "../../GlobalLanguageTranslations";
import LanguageTranslations from "./LanguageTranslations";

const AccountTab = () => {
    const { user, language } = useUserContext();
    const router = useRouter();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();

    if (!user) return <LoadingFallback />;

    const updateUserProfile = async (parsedFieldValues: z.infer<typeof UserUpdateSchema>) => {
        await updateUser(user.id, parsedFieldValues);
        return GlobalLanguageTranslations.successfulSave[language];
    };

    const validateAndUpdateCredentials = async (
        parsedFieldValues: z.infer<typeof UpdateCredentialsSchema>,
    ) => {
        if (parsedFieldValues.newPassword !== parsedFieldValues.repeatPassword) {
            throw new Error(LanguageTranslations.nonMatchingPasswords[language]);
        }
        await updateUserCredentials(user.id, parsedFieldValues);
        return GlobalLanguageTranslations.successfulSave[language];
    };

    const deleteMyAccount = async () =>
        startTransition(async () => {
            try {
                await deleteUser(user.id);
                try {
                    await signOut();
                } catch {
                    clientRedirect(router, [GlobalConstants.HOME]);
                }
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
            <Button onClick={activateMembership} disabled={isPending}>
                {LanguageTranslations.activateMembership[language](user)}
            </Button>
            <Form
                name={GlobalConstants.PROFILE}
                buttonLabel={GlobalLanguageTranslations.save[language]}
                action={updateUserProfile}
                validationSchema={UserUpdateSchema}
                defaultValues={user}
            ></Form>
            <Form
                name={GlobalConstants.USER_CREDENTIALS}
                buttonLabel={GlobalLanguageTranslations.save[language]}
                action={validateAndUpdateCredentials}
                validationSchema={UpdateCredentialsSchema}
            ></Form>

            <ConfirmButton color="error" onClick={deleteMyAccount} disabled={isPending}>
                {LanguageTranslations.deleteAccount[language]}
            </ConfirmButton>
        </Stack>
    );
};

export default AccountTab;
