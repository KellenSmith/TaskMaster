"use client";
import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { Button, Stack } from "@mui/material";
import { FC } from "react";
import { LoginSchema } from "../../lib/zod-schemas";
import z from "zod";
import { clientRedirect } from "../../lib/definitions";
import { useRouter } from "next/navigation";
import { login } from "../../lib/user-credentials-actions";
import { useUserContext } from "../../context/UserContext";
import { failedSigninCodes } from "../../lib/auth";
import LanguageTranslations from "./LanguageTranslations";

const LoginPage: FC = () => {
    const { refreshSession, language } = useUserContext();
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
                // TODO: This doesn't work in production
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
                buttonLabel={LanguageTranslations.login[language]}
                validationSchema={LoginSchema}
                action={loginAction}
                readOnly={false}
                editable={false}
            />
            <Button onClick={() => clientRedirect(router, [GlobalConstants.RESET])}>
                {LanguageTranslations.resetPassword[language]}
            </Button>
            <Button onClick={() => clientRedirect(router, [GlobalConstants.APPLY])}>
                {LanguageTranslations.applyForMembership[language]}
            </Button>
        </Stack>
    );
};

export default LoginPage;
