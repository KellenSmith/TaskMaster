"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { deleteUser, updateUser } from "../../lib/user-actions";
import { Button, Card, CardContent, Stack, Typography, useTheme } from "@mui/material";
import { isMembershipExpired, isUserAdmin } from "../../lib/definitions";
import ConfirmButton from "../../ui/ConfirmButton";
import { allowRedirectException, formatDate, navigateToRoute } from "../../ui/utils";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { deleteUserCookieAndRedirectToHome } from "../../lib/auth";
import { useNotificationContext } from "../../context/NotificationContext";
import { UpdateCredentialsSchema, UserUpdateSchema } from "../../lib/zod-schemas";
import { updateUserCredentials } from "../../lib/user-credentials-actions";
import { createMembershipOrder } from "../../lib/user-membership-actions";
import z from "zod";
import { useTransition } from "react";

const AccountTab = () => {
    const theme = useTheme();
    const router = useRouter();
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [isPending, startTransition] = useTransition();

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
        await updateUserCredentials(parsedFieldValues);
        return "Successfully updated password";
    };

    const deleteMyAccount = async () =>
        startTransition(async () => {
            try {
                await deleteUser(user.id);
                try {
                    await deleteUserCookieAndRedirectToHome();
                } catch {
                    navigateToRoute("/", router);
                }
            } catch {
                addNotification("Failed to delete account", "error");
            }
        });

    const activateMembership = async () =>
        startTransition(async () => {
            try {
                await createMembershipOrder();
            } catch (error) {
                allowRedirectException(error);
                // Show notification for all other errors
                addNotification("Failed to activate membership", "error");
            }
        });

    return (
        <Stack>
            <Card>
                <CardContent sx={{ color: theme.palette.secondary.main }}>
                    {isMembershipExpired(user) ? (
                        <Typography>Your membership is expired!</Typography>
                    ) : (
                        <>
                            <Typography>{`Member since ${formatDate(user.createdAt)}`}</Typography>
                            <Typography>
                                {`Your membership expires ${formatDate(dayjs(user.userMembership.expiresAt))}`}
                            </Typography>
                            {isUserAdmin(user) && <Typography>You are an admin</Typography>}
                        </>
                    )}
                </CardContent>
            </Card>
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
            <Button onClick={activateMembership} disabled={isPending}>
                {`${isMembershipExpired(user) ? "Activate" : "Extend"} membership`}
            </Button>
            <ConfirmButton color="error" onClick={deleteMyAccount} disabled={isPending}>
                Delete My Account
            </ConfirmButton>
        </Stack>
    );
};

export default AccountTab;
