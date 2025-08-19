"use client";

import GlobalConstants from "../../GlobalConstants";
import Form, { getFormActionMsg } from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { deleteUser, updateUser } from "../../lib/user-actions";
import { useState } from "react";
import { Button, Card, CardContent, Stack, Typography, useTheme } from "@mui/material";
import { defaultFormActionState, isMembershipExpired, isUserAdmin } from "../../lib/definitions";
import ConfirmButton from "../../ui/ConfirmButton";
import { formatDate, navigateToRoute } from "../../ui/utils";
import dayjs from "dayjs";
import { createMembershipOrder } from "../../lib/order-actions";
import { useRouter } from "next/navigation";
import { NextURL } from "next/dist/server/web/next-url";
import { deleteUserCookieAndRedirectToHome } from "../../lib/auth/auth";
import { useNotificationContext } from "../../context/NotificationContext";
import { UpdateCredentialsSchema, UserUpdateSchema } from "../../lib/zod-schemas";
import { updateUserCredentials } from "../../lib/user-credentials-actions";
import { Prisma } from "@prisma/client";

const AccountTab = () => {
    const theme = useTheme();
    const router = useRouter();
    const { user } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [accountActionState, setAccountActionState] = useState(defaultFormActionState);

    const updateUserProfile = async (fieldValues: Prisma.UserUpdateInput) => {
        await updateUser(user.id, fieldValues);
        return "Successfully updated profile";
    };

    const validateAndUpdateCredentials = async (
        parsedFieldValues: typeof UpdateCredentialsSchema.shape,
    ) => {
        if (parsedFieldValues.newPassword !== parsedFieldValues.repeatPassword) {
            throw new Error("New password and repeat password do not match");
        }
        await updateUserCredentials(parsedFieldValues);
        return "Successfully updated password";
    };

    const deleteMyAccount = async () => {
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
    };

    const payMembership = async () => {
        const createMembershipOrderResult = await createMembershipOrder(defaultFormActionState);
        if (createMembershipOrderResult.status === 201) {
            const orderUrl = new NextURL(`/${GlobalConstants.ORDER}`, window.location.origin);
            orderUrl.searchParams.set(GlobalConstants.ORDER_ID, createMembershipOrderResult.result);
            router.push(orderUrl.toString());
            createMembershipOrderResult.result = "Redirecting to payment...";
        }
        setAccountActionState(createMembershipOrderResult);
    };

    return (
        user && (
            <>
                <Stack>
                    <Card>
                        <CardContent sx={{ color: theme.palette.secondary.main }}>
                            {isMembershipExpired(user) ? (
                                <>
                                    <Typography>Your membership is expired!</Typography>
                                </>
                            ) : (
                                <>
                                    <Typography>{`Member since ${formatDate(user.created)}`}</Typography>
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
                    {getFormActionMsg(accountActionState)}
                    <Button onClick={payMembership}>
                        {`${isMembershipExpired(user) ? "Activate" : "Extend"} membership`}
                    </Button>
                    <ConfirmButton color="error" onClick={deleteMyAccount}>
                        Delete My Account
                    </ConfirmButton>
                </Stack>
            </>
        )
    );
};

export default AccountTab;
