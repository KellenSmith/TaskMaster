"use client";

import GlobalConstants from "../../GlobalConstants";
import Form, { FormActionState, getFormActionMsg } from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { deleteUser, updateUser, updateUserCredentials } from "../../lib/user-actions";
import { login } from "../../lib/auth/auth";
import { useState } from "react";
import { defaultActionState } from "../../ui/form/Form";
import { Button, Card, CardContent, Stack, Typography, useTheme } from "@mui/material";
import {
    isMembershipExpired,
    isUserAdmin,
    LoginSchema,
    UpdateCredentialsSchema,
} from "../../lib/definitions";
import SwishPaymentHandler from "../../ui/swish/SwishPaymentHandler";
import { Prisma } from "@prisma/client";
import ConfirmButton from "../../ui/ConfirmButton";
import { apiEndpoints, formatDate } from "../../ui/utils";
import dayjs from "dayjs";

const AccountTab = () => {
    const theme = useTheme();
    const { user, updateLoggedInUser, logOut } = useUserContext();
    const [accountActionState, setAccountActionState] = useState(defaultActionState);
    const [openRenewMembershipDialog, setOpenRenewMembershipDialog] = useState(false);

    const updateUserProfile = async (
        currentActionState: FormActionState,
        fieldValues: Prisma.UserUpdateInput,
    ) => {
        const updateUserState = await updateUser(
            user[GlobalConstants.ID],
            currentActionState,
            fieldValues,
        );
        await updateLoggedInUser();
        return updateUserState;
    };

    const validateAndUpdateCredentials = async (
        currentActionState: FormActionState,
        fieldValues: UpdateCredentialsSchema,
    ) => {
        const newActionState = { ...currentActionState };
        // Check new and repeated passwords match
        if (fieldValues.newPassword !== fieldValues.repeatPassword) {
            newActionState.status = 500;
            newActionState.result = "";
            newActionState.errorMsg = "Passwords do not match";
            return newActionState;
        }
        // Check current password
        const validatedCurrentPassword: LoginSchema = {
            email: user.email,
            password: fieldValues.currentPassword,
        };
        const validateCurrentResult = await login(currentActionState, validatedCurrentPassword);
        if (validateCurrentResult.status !== 200) return validateCurrentResult;

        // Update credentials
        const updatedPassWord = {
            email: user.email,
            password: fieldValues.newPassword,
        };
        const updateCredentialsState = await updateUserCredentials(
            currentActionState,
            updatedPassWord,
        );
        return updateCredentialsState;
    };

    const deleteMyAccount = async () => {
        const deleteState = await deleteUser(user, defaultActionState);
        if (deleteState.status === 200) logOut();
        setAccountActionState(deleteState);
    };

    const hasRenewedMembership = async () => {
        const updatedUser = await updateLoggedInUser();
        return !isMembershipExpired(updatedUser);
    };

    // TODO: Renew access token when membership has been validated

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
                                    <Typography>{`Member since ${formatDate(user[GlobalConstants.CREATED])}`}</Typography>
                                    <Typography>
                                        {`Your membership expires ${formatDate(dayjs(user[GlobalConstants.MEMBERSHIP_RENEWED]).add(parseInt(process.env.NEXT_PUBLIC_MEMBERSHIP_DURATION), "d"))}`}
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
                        defaultValues={user}
                    ></Form>
                    <Form
                        name={GlobalConstants.USER_CREDENTIALS}
                        buttonLabel="save"
                        action={validateAndUpdateCredentials}
                    ></Form>
                    {getFormActionMsg(accountActionState)}
                    <Button onClick={() => setOpenRenewMembershipDialog(true)}>
                        {`${isMembershipExpired(user) ? "Activate" : "Extend"} membership`}
                    </Button>
                    <ConfirmButton color="error" onClick={deleteMyAccount}>
                        Delete My Account
                    </ConfirmButton>
                </Stack>
                <SwishPaymentHandler
                    title={`${isMembershipExpired(user) ? "Activate" : "Extend"} Membership`}
                    open={openRenewMembershipDialog}
                    setOpen={setOpenRenewMembershipDialog}
                    hasPaid={hasRenewedMembership}
                    paymentAmount={parseInt(process.env.NEXT_PUBLIC_MEMBERSHIP_FEE)}
                    callbackEndpoint={apiEndpoints.RENEW_MEMBERSHIP}
                    callbackParams={
                        new URLSearchParams([[GlobalConstants.ID, user[GlobalConstants.ID]]])
                    }
                />
            </>
        )
    );
};

export default AccountTab;
