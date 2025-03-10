"use client";

import GlobalConstants from "../../GlobalConstants";
import Form, { FormActionState, getFormActionMsg } from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { deleteUser, updateUser, updateUserCredentials } from "../../lib/user-actions";
import { login } from "../../lib/auth/auth";
import { useState } from "react";
import { defaultActionState } from "../../ui/form/Form";
import { Button, Stack } from "@mui/material";
import { isMembershipExpired, LoginSchema, UpdateCredentialsSchema } from "../../lib/definitions";
import SwishPaymentHandler from "../../ui/swish/SwishPaymentHandler";
import { OrgSettings } from "../../lib/org-settings";
import { Prisma } from "@prisma/client";

const AccountTab = () => {
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
                    {isMembershipExpired(user) && (
                        <Button onClick={() => setOpenRenewMembershipDialog(true)}>
                            Renew membership
                        </Button>
                    )}
                    <Button color="error" onClick={deleteMyAccount}>
                        Delete My Account
                    </Button>
                </Stack>
                <SwishPaymentHandler
                    title={"Renew membership"}
                    open={openRenewMembershipDialog}
                    setOpen={setOpenRenewMembershipDialog}
                    hasPaid={hasRenewedMembership}
                    paymentAmount={OrgSettings[GlobalConstants.MEMBERSHIP_FEE] as number}
                    callbackEndpoint="renew-membership"
                    callbackParams={
                        new URLSearchParams([[GlobalConstants.ID, user[GlobalConstants.ID]]])
                    }
                />
            </>
        )
    );
};

export default AccountTab;
