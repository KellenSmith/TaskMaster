import { Language } from "@prisma/client";
import { MailResult } from "../../ui/utils";

const LanguageTranslations = {
    sendMassEmail: {
        [Language.english]: "Send Mass Email",
        [Language.swedish]: "Skicka massutskick",
    },
    sendToRecipients: {
        [Language.english]: (recipientCount: number) =>
            `Send to ${recipientCount} recipients${recipientCount > 250 ? " in batches of 250 per minute as long as there is activity on the website. If there is not, batches will be sent once per day at about 04:00." : "."}`,
        [Language.swedish]: (recipientCount: number) =>
            `Skicka till ${recipientCount} mottagare${recipientCount > 250 ? " i omgångar om 250 per minut så länge det finns aktivitet på webbplatsen. Om inte, skickas omgångar en gång per dag ungefär kl 04:00." : "."}`,
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
        [Language.english]: (result: MailResult) =>
            `Sendout succeeded: ${result.accepted} accepted, ${result.rejected} rejected`,
        [Language.swedish]: (result: MailResult) =>
            `Utskick lyckades: ${result.accepted} accepterade, ${result.rejected} avvisade`,
    },
    successfulQueuedSendout: {
        [Language.english]: `Sendout queued: recipients will receive the email in batches as long as there's activity on the site. Check in later to see progress.`,
        [Language.swedish]: `Utskick i kö: mottagare kommer att få e-postmeddelandet i omgångar så länge det finns aktivitet på webbplatsen. Kontrollera senare för att se framsteg.`,
    },
    failedSendMail: {
        [Language.english]: "Failed to send mail",
        [Language.swedish]: "Kunde inte skicka mail",
    },
};

export default LanguageTranslations;
