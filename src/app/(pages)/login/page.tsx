"use client";
import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { Button, Stack } from "@mui/material";
import { FC } from "react";
import { LoginSchema } from "../../lib/zod-schemas";
import z from "zod";
import { clientRedirect } from "../../lib/utils";
import { useRouter } from "next/navigation";
import { useUserContext } from "../../context/UserContext";
import LanguageTranslations from "./LanguageTranslations";
import { login } from "../../lib/user-actions";

const LoginPage: FC = () => {
    const { language } = useUserContext();
    const router = useRouter();

    const loginAction = async (formData: FormData) => {
        try {
            await login(formData);
            return LanguageTranslations.loggingIn[language];
        } catch {
            throw new Error(LanguageTranslations.failedLogin[language]);
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
            <Button onClick={() => clientRedirect(router, [GlobalConstants.APPLY])}>
                {LanguageTranslations.applyForMembership[language]}
            </Button>
        </Stack>
    );
};

export default LoginPage;
