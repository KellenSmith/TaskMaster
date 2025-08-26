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

const LoginPage: FC = () => {
    const router = useRouter();

    const loginAction = async (parsedFieldValues: z.infer<typeof LoginSchema>) => {
        await login(parsedFieldValues);
        router.refresh();
        return "Logged in";
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
