"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { Button, Stack } from "@mui/material";
import { FC } from "react";
import { resetUserCredentials } from "../../lib/actions";

const LoginForm: FC = () => {
    return (
        <Stack>
            <Form
                name={GlobalConstants.RESET}
                buttonLabel={GlobalConstants.RESET}
                action={resetUserCredentials}
            />
            <Button>{GlobalConstants.RESET}</Button>
        </Stack>
    );
};

export default LoginForm;
