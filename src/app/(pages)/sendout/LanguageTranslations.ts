import { Language } from "@prisma/client";

const LanguageTranslations = {
    sendMassEmail: {
        [Language.english]: "Send Mass Email",
        [Language.swedish]: "Skicka massutskick",
    },
    sendToRecipients: {
        [Language.english]: (recipientCount: number) =>
            `Send to ${recipientCount} recipients. One batch of 250 emails is processed per day. Your sendout will be queued and processed in ${Math.ceil(recipientCount / 250) - 1} days`,
        [Language.swedish]: (recipientCount: number) =>
            `Skicka till ${recipientCount} mottagare. En batch med 250 e-postmeddelanden behandlas per dag. Ditt utskick kommer att köas och behandlas på ${Math.ceil(recipientCount / 250) - 1} dagar`,
    },
    send: {
        [Language.english]: "Send",
        [Language.swedish]: "Skicka",
    },
    confirmSendMassEmail: {
        [Language.english]: (recipientCount: number) =>
            `Are you sure you want to send this email to ${recipientCount} recipients?`,
        [Language.swedish]: (recipientCount: number) =>
            `Är du säker på att du vill skicka detta e-postmeddelande till ${recipientCount} mottagare?`,
    },
    successfulSendout: {
        [Language.english]: "Sendout processing",
        [Language.swedish]: "Utskick pågår",
    },
    failedSendMail: {
        [Language.english]: "Failed to send mail",
        [Language.swedish]: "Kunde inte skicka mail",
    },
};

export default LanguageTranslations;
