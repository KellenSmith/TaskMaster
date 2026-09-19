"use client";
import { Button, Stack, Typography } from "@mui/material";
import { FC, startTransition, useState } from "react";
import { useUserContext } from "../../../../context/UserContext";
import { useNotificationContext } from "../../../../context/NotificationContext";
import { confirmDevicePairingRequest } from "../../../../lib/device-pairing-actions";
import GlobalConstants from "../../../../GlobalConstants";
import LanguageTranslations from "../../LanguageTranslations";

interface ApproveDevicePairingDashboardProps {
    user_code: string;
    requesting_user_agent: string | null;
}

const ApproveDevicePairingDashboard: FC<ApproveDevicePairingDashboardProps> = ({
    user_code,
    requesting_user_agent,
}) => {
    const { language } = useUserContext();
    const { addNotification } = useNotificationContext();
    const [approved, setApproved] = useState(false);

    const handleApprove = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.set(GlobalConstants.USER_CODE, user_code);
            const errorMsg = await confirmDevicePairingRequest(formData);
            if (errorMsg) {
                addNotification(errorMsg, "error");
                return;
            }
            setApproved(true);
        });
    };

    if (approved) {
        return <Typography>{LanguageTranslations.devicePairingApproved[language]}</Typography>;
    }

    return (
        <Stack spacing={2} sx={{ alignItems: "center" }}>
            <Typography variant="h6">{LanguageTranslations.deviceWantsToLogIn[language]}</Typography>
            {requesting_user_agent && (
                <Typography color="text.secondary">{requesting_user_agent}</Typography>
            )}
            <Button variant="contained" onClick={handleApprove}>
                {LanguageTranslations.approve[language]}
            </Button>
        </Stack>
    );
};

export default ApproveDevicePairingDashboard;
