"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { useUserContext } from "../../context/UserContext";
import { Button, Stack } from "@mui/material";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { navigateToRoute } from "../../ui/utils";

const LoginForm: FC = () => {
    const { login } = useUserContext();
    const router = useRouter();

    return (
        <Stack>
            <Form
                name={GlobalConstants.LOGIN}
                buttonLabel={GlobalConstants.LOGIN}
                action={login}
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

export default LoginForm;
