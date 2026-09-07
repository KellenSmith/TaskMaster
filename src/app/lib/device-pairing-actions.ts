"use server";

import { createElement } from "react";
import { prisma } from "../../prisma/prisma-client";
import { DevicePairingUserCodeSchema } from "./zod-schemas";
import { getLoggedInUser, getUserLanguage } from "./user-helpers";
import { sendMail } from "./mail-service/mail-service";
import MailTemplate from "./mail-service/mail-templates/MailTemplate";
import LanguageTranslations from "./LanguageTranslations";
import { DevicePairingStatus } from "../../prisma/generated/enums";

export const confirmDevicePairingRequest = async (
    formData: FormData,
): Promise<void | string> => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) {
        const language = await getUserLanguage();
        return LanguageTranslations.unauthorized[language];
    }

    const { user_code } = DevicePairingUserCodeSchema.parse(Object.fromEntries(formData.entries()));

    // Atomically claim the request: only succeeds while it's still pending and unexpired
    const claimed = await prisma.devicePairingRequest.updateMany({
        where: {
            user_code,
            status: DevicePairingStatus.pending,
            expires_at: { gt: new Date() },
        },
        data: {
            status: DevicePairingStatus.confirmed,
            user_id: loggedInUser.id,
        },
    });

    if (claimed.count !== 1) {
        const language = await getUserLanguage();
        return LanguageTranslations.devicePairingExpiredOrInvalid[language];
    }

    // Best-effort security notification - a failure to send should not fail the approval
    try {
        const mailContent = createElement(MailTemplate, {
            html: "A new device was just signed in to your account using device pairing. If this wasn't you, please contact an administrator.",
        });
        await sendMail([loggedInUser.email], "New device signed in to your account", mailContent);
    } catch (error) {
        console.error("Failed to send device pairing notification email:", error);
    }
};
