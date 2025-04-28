import { Stack } from "@mui/material";
import { FC, useActionState } from "react";
import GlobalConstants from "../../GlobalConstants";
import { sendMassEmail } from "../../lib/mail-service/mail-service";
import Form, { defaultActionState, FormActionState } from "../../ui/form/Form";

const SendoutPage: FC = () => {
    const sendMassEmailAction = async (currentActionState: FormActionState, fieldValues) => {
        const newActionState = { ...currentActionState };
        const userEmails = [
            "kellensmith407@gmail.com",
            "kellensmith407@gmail.com",
            "kellensmith407@gmail.com",
        ];
        try {
            const sendoutResult = await sendMassEmail(
                userEmails,
                fieldValues[GlobalConstants.SUBJECT],
                fieldValues[GlobalConstants.CONTENT],
            );
            newActionState.status = 200;
            newActionState.errorMsg = "";
            newActionState.result = sendoutResult;
        } catch (error) {
            newActionState.status = 500;
            newActionState.errorMsg = "Failed to send mass email";
            newActionState.result = "";
        }

        return newActionState;
    };

    return (
        <Stack>
            <Form
                name={GlobalConstants.SENDOUT}
                action={sendMassEmailAction}
                readOnly={false}
                editable={false}
            />
        </Stack>
    );
};
export default SendoutPage;
