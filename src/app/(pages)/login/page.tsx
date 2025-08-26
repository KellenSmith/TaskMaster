"use client";
import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { Button, Stack } from "@mui/material";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { FC } from "react";
import { LoginSchema } from "../../lib/zod-schemas";
import z from "zod";
import { clientRedirect } from "../../lib/definitions";
import { useRouter } from "next/navigation";
import { login } from "../../lib/user-credentials-actions";
import { useUserContext } from "../../context/UserContext";
import { failedSigninCodes } from "../../lib/auth";

const LoginPage: FC = () => {
    const { refreshSession } = useUserContext();
    const router = useRouter();

    const loginAction = async (parsedFieldValues: z.infer<typeof LoginSchema>) => {
        try {
            await login(parsedFieldValues);
            return "Logged in. Redirecting...";
        } catch (error) {
            // If login is successful, redirect exception is thrown.
            // Refresh session before moving on
            if (error?.digest?.startsWith("NEXT_REDIRECT")) {
                refreshSession();
                throw error;
                // Allow the error messages thrown by the auth.ts authorize function through
            } else if (Object.values(failedSigninCodes).includes(error?.message)) {
                throw error;
            }
            // Unexpected errors
            throw new Error("Failed to log in");
        }
    };

    return (
        <Stack>
            <Form
                name={GlobalConstants.LOGIN}
                buttonLabel={GlobalConstants.LOGIN}
                validationSchema={LoginSchema}
                action={loginAction}
                readOnly={false}
                editable={false}
            />
            <Button onClick={() => clientRedirect(router, [GlobalConstants.RESET])}>
                reset password
            </Button>
            <Button onClick={() => clientRedirect(router, [GlobalConstants.APPLY])}>
                {FieldLabels[GlobalConstants.APPLY]}
            </Button>
        </Stack>
    );
};

export default LoginPage;
