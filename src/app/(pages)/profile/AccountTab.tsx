"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { deleteUser, updateUser } from "../../lib/user-actions";
import {
    Button,
    Card,
    CardContent,
    Stack,
    Typography,
    useTheme,
    Chip,
    Divider,
} from "@mui/material";
import { isMembershipExpired, clientRedirect } from "../../lib/definitions";
import ConfirmButton from "../../ui/ConfirmButton";
import { allowRedirectException, formatDate } from "../../ui/utils";
import { Person, Schedule, AdminPanelSettings, Warning, CheckCircle } from "@mui/icons-material";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { signOut } from "../../lib/auth";
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
                await createMembershipOrder();
            } catch (error) {
                allowRedirectException(error);
                // Show notification for all other errors
                addNotification("Failed to activate membership", "error");
            }
        });

    return (
        <Stack>
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
            <Card elevation={3}>
                <CardContent>
                    <Stack spacing={3}>
                        {/* Header */}
                        <Stack
                            display="flex"
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Membership
                            </Typography>
                            {isMembershipExpired(user) ? (
                                <Chip
                                    icon={<Warning />}
                                    label="Expired"
                                    color="error"
                                    size="small"
                                />
                            ) : (
                                <Chip
                                    icon={<CheckCircle />}
                                    label="Active"
                                    color="success"
                                    size="small"
                                />
                            )}
                        </Stack>

                        <Divider />

                        {/* Membership Info */}
                        {isMembershipExpired(user) ? (
                            <Stack
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    backgroundColor: theme.palette.error.light + "20",
                                    border: `1px solid ${theme.palette.error.light}`,
                                }}
                            >
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: theme.palette.error.main,
                                        fontWeight: 500,
                                        textAlign: "center",
                                    }}
                                >
                                    {user.userMembership
                                        ? "Your membership has expired and needs renewal"
                                        : "Welcome! Activate your membership to get started"}
                                </Typography>
                            </Stack>
                        ) : (
                            <Stack spacing={2}>
                                {/* Member Since */}
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Person color="primary" />
                                    <Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            Member since
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {formatDate(user.createdAt)}
                                        </Typography>
                                    </Stack>
                                </Stack>

                                {/* Expiration Date */}
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Schedule color="primary" />
                                    <Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            Membership expires
                                        </Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {formatDate(dayjs(user.userMembership.expiresAt))}
                                        </Typography>
                                    </Stack>
                                </Stack>

                                <Stack direction="row" spacing={2} alignItems="center">
                                    <AdminPanelSettings color="primary" />
                                    <Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            Role
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            sx={{ fontWeight: 500, textTransform: "capitalize" }}
                                        >
                                            {user.role}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                </CardContent>
            </Card>
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
