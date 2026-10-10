import { Stack, Typography } from "@mui/material";
import GlobalConstants from "../../../../GlobalConstants";
import ProtectedPage from "../../../../ProtectedPage";
import { getLoggedInUser, getUserLanguage } from "../../../../lib/user-helpers";
import { getDevicePairingRequestByUserCode } from "../../../../lib/device-pairing-helpers";
import { DevicePairingUserCodeSchema } from "../../../../lib/zod-schemas";
import LoginDashboard from "../../LoginDashboard";
import ApproveDevicePairingDashboard from "./ApproveDevicePairingDashboard";
import LanguageTranslations from "../../LanguageTranslations";
import { Language } from "../../../../../prisma/generated/enums";

const ApproveDevicePairingPage = async ({
    params,
}: {
    params: Promise<{ user_code: string }>;
}) => {
    const { user_code } = await params;
    const language: Language = await getUserLanguage();

    return (
        <ProtectedPage name={GlobalConstants.LOGIN}>
            <ApproveDevicePairingContent user_code={decodeURIComponent(user_code)} language={language} />
        </ProtectedPage>
    );
};

const ApproveDevicePairingContent = async ({
    user_code,
    language,
}: {
    user_code: string;
    language: Language;
}) => {
    const parsedUserCode = DevicePairingUserCodeSchema.safeParse({ user_code });
    const pairingRequest = parsedUserCode.success
        ? await getDevicePairingRequestByUserCode(parsedUserCode.data.user_code)
        : null;

    if (!pairingRequest) {
        return <Typography>{LanguageTranslations.codeExpiredRegenerate[language]}</Typography>;
    }

    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) {
        return (
            <Stack spacing={2}>
                <Typography>{LanguageTranslations.enterCodeFromOtherDevice[language]}</Typography>
                <LoginDashboard />
            </Stack>
        );
    }

    return (
        <ApproveDevicePairingDashboard
            user_code={parsedUserCode.success ? parsedUserCode.data.user_code : user_code}
            requesting_user_agent={pairingRequest.requesting_user_agent}
        />
    );
};

export default ApproveDevicePairingPage;
