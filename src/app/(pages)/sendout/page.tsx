import { Stack } from "@mui/material";
import { FC } from "react";
import GlobalConstants from "../../GlobalConstants";
import { sendMassEmail } from "../../lib/mail-service/mail-service";
import Form, { FormActionState } from "../../ui/form/Form";

const SendoutPage: FC = () => {
    const sendMassEmailAction = async (currentActionState: FormActionState, fieldValues) => {
        "use server";
        const newActionState = { ...currentActionState };
        const userEmails = [
            "kellensmith407@gmail.com",
            // "n.henriksson91@gmail.com",
            // "nova.colliander@gmail.com",
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
                buttonLabel="Send"
                readOnly={false}
                editable={false}
            />
        </Stack>
    );
};
export default SendoutPage;
