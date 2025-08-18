"use client";
import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { Button, Stack } from "@mui/material";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { useRouter } from "next/navigation";
import { FC } from "react";
import z from "zod";
import { login } from "../../lib/auth/auth";
import { navigateToRoute } from "../../ui/utils";
import { LoginSchema } from "../../lib/zod-schemas";

const LoginPage: FC = () => {
    const router = useRouter();

    const handleLogin = async (parsedFieldValues: typeof LoginSchema.shape) => {
        await login(parsedFieldValues);
        return "Logged in successfully. Redirecting...";
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
