"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { deleteUser, updateUser } from "../../lib/user-actions";
import { Button, Stack, useTheme } from "@mui/material";
import { isMembershipExpired, clientRedirect } from "../../lib/definitions";
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

const AccountTab = () => {
    const { user } = useUserContext();
    const router = useRouter();
    const theme = useTheme();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();

    if (!user) return <LoadingFallback />;

    const updateUserProfile = async (parsedFieldValues: z.infer<typeof UserUpdateSchema>) => {
        await updateUser(user.id, parsedFieldValues);
        return "Successfully updated profile";
    };

    const validateAndUpdateCredentials = async (
        parsedFieldValues: z.infer<typeof UpdateCredentialsSchema>,
    ) => {
        if (parsedFieldValues.newPassword !== parsedFieldValues.repeatPassword) {
            throw new Error("New password and repeat password do not match");
        }
        await updateUserCredentials(user.id, parsedFieldValues);
        return "Successfully updated password";
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
                addNotification("Failed to delete account", "error");
            }
        });

    const activateMembership = async () =>
        startTransition(async () => {
            try {
                await createMembershipOrder(user.id);
            } catch (error) {
                allowRedirectException(error);
                // Show notification for all other errors
                addNotification("Failed to activate membership", "error");
            }
        });

    return (
        <Stack>
            <MembershipStatusCard />
            <Button onClick={activateMembership} disabled={isPending}>
                {`${isMembershipExpired(user) ? "Activate" : "Extend"} membership`}
            </Button>
            <Form
                name={GlobalConstants.PROFILE}
                buttonLabel="save"
                action={updateUserProfile}
                validationSchema={UserUpdateSchema}
                defaultValues={user}
            ></Form>
            <Form
                name={GlobalConstants.USER_CREDENTIALS}
                buttonLabel="save"
                action={validateAndUpdateCredentials}
                validationSchema={UpdateCredentialsSchema}
            ></Form>

            <ConfirmButton color="error" onClick={deleteMyAccount} disabled={isPending}>
                Delete My Account
            </ConfirmButton>
        </Stack>
    );
};

export default AccountTab;
