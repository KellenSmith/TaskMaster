"use client";
import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { Button, Stack } from "@mui/material";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { login } from "../../lib/auth";
import { allowRedirectException } from "../../ui/utils";
import { LoginSchema } from "../../lib/zod-schemas";
import z from "zod";
import { clientRedirect } from "../../lib/definitions";

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
