"use client";

import GlobalConstants from "../../GlobalConstants";
import Form from "../../ui/form/Form";
import { Stack } from "@mui/material";
import { FC } from "react";
import { resetUserCredentials } from "../../lib/user-credentials-actions";
import { ResetCredentialsSchema } from "../../lib/zod-schemas";
import z from "zod";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";

const ResetPage: FC = () => {
    const { language } = useUserContext();
    const handleReset = async (values: z.infer<typeof ResetCredentialsSchema>) => {
        try {
            await resetUserCredentials(values);
        } catch {
            // Don't show errors here
        }
        // Return ambiguous error message to prevent revealing if the email is registered or not.
        return "New credentials sent to your email if we have it on record";
    };
    return (
        <Stack>
            <Form
                name={GlobalConstants.RESET}
                buttonLabel={LanguageTranslations[GlobalConstants.RESET][language]}
                action={handleReset}
                validationSchema={ResetCredentialsSchema}
                readOnly={false}
                editable={false}
            />
        </Stack>
    );
};

export default ResetPage;
