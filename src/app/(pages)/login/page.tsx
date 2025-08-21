"use client";
import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { Button, Stack } from "@mui/material";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { login } from "../../lib/auth/auth";
import { allowRedirectException, navigateToRoute } from "../../ui/utils";
import { LoginSchema } from "../../lib/zod-schemas";
import z from "zod";

const LoginPage: FC = () => {
    const router = useRouter();

    const handleLogin = async (parsedFieldValues: z.infer<typeof LoginSchema>) => {
        try {
            await login(parsedFieldValues);
            return "Logged in successfully. Redirecting...";
        } catch (error) {
            allowRedirectException(error);
            throw new Error(error.message);
        }
    };

    return (
        <Stack>
            <Form
                name={GlobalConstants.LOGIN}
                buttonLabel={GlobalConstants.LOGIN}
                validationSchema={LoginSchema}
                action={handleLogin}
                readOnly={false}
                editable={false}
            />
            <Button onClick={() => navigateToRoute(`/${GlobalConstants.RESET}`, router)}>
                reset password
            </Button>
            <Button onClick={() => navigateToRoute(`/${GlobalConstants.APPLY}`, router)}>
                {FieldLabels[GlobalConstants.APPLY]}
            </Button>
        </Stack>
    );
};

export default LoginPage;
