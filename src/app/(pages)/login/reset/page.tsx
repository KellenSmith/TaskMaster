"use client";

import GlobalConstants from "../../../GlobalConstants";
import Form from "../../../ui/form/Form";
import { Stack } from "@mui/material";
import { FC } from "react";
import { resetUserCredentials } from "../../../lib/user-actions";

const LoginForm: FC = () => {
    return (
        <Stack>
            <Form
                name={GlobalConstants.RESET}
                buttonLabel={GlobalConstants.RESET}
                action={resetUserCredentials}
                readOnly={false}
                editable={false}
            />
        </Stack>
    );
};

export default LoginForm;
