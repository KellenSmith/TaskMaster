"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { Button, Stack } from "@mui/material";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { redirect } from "next/navigation";
import { FC } from "react";

const LoginForm: FC = () => {
    const { login } = useUserContext();

    return (
        <Stack>
            <Form
                name={GlobalConstants.LOGIN}
                buttonLabel={GlobalConstants.LOGIN}
                action={login}
                readOnly={false}
                editable={false}
            />
            <Button onClick={() => redirect(`/${GlobalConstants.RESET}`)}>reset password</Button>
            <Button onClick={() => redirect(`/${GlobalConstants.APPLY}`)}>
                {FieldLabels[GlobalConstants.APPLY]}
            </Button>
        </Stack>
    );
};

export default LoginForm;
