import { Language } from "@prisma/client";

const LanguageTranslations = {
    sendMassEmail: {
        [Language.english]: "Send Mass Email",
        [Language.swedish]: "Skicka massutskick",
    },
    sendToRecipients: {
        [Language.english]: (recipientCount: number) => `Send to ${recipientCount} recipients`,
        [Language.swedish]: (recipientCount: number) => `Skicka till ${recipientCount} mottagare`,
    },
    send: {
        [Language.english]: "Send",
        [Language.swedish]: "Skicka",
    },
    successfulSendout: {
        [Language.english]: (result) =>
            `Sendout successful. Accepted: ${result?.accepted || 0}, rejected: ${result?.rejected || 0}`,
        [Language.swedish]: (result) =>
            `Utskick lyckades. Accepterade: ${result?.accepted || 0}, avvisade: ${result?.rejected || 0}`,
    },
    failedSendMail: {
        [Language.english]: "Failed to send mail",
        [Language.swedish]: "Kunde inte skicka mail",
    },
};

export default LanguageTranslations;
