import { no } from "zod/locales";
import { Language } from "../../prisma/generated/enums";

const LanguageTranslations = {
    unauthorized: {
        [Language.english]: "Unauthorized",
        [Language.swedish]: "Obehörig",
    },
    eventParticipantNotFound: {
        [Language.english]: "Event participant not found",
        [Language.swedish]: "Evenemangsdeltagare hittades inte",
    },
    alreadyCheckedIn: {
        [Language.english]: "Already checked in at",
        [Language.swedish]: "Redan checkat in vid",
    },
    motivationRequired: {
        [Language.english]: "Motivation required.",
        [Language.swedish]: "Motivation obligatorisk.",
    },
    nicknameAlreadyExists: {
        [Language.english]: "A user with this nickname already exists.",
        [Language.swedish]: "En användare med detta smeknamn finns redan.",
    },
    failedLogin: {
        [Language.swedish]:
            "Kund inte logga in. Om du inte redan är medlem kan du ansöka om medlemskap.",
        [Language.english]:
            "Failed to log in. If you are not already a member, you can apply for membership.",
    },
    swedbankPayNotConfigured: {
        [Language.english]: "Swedbank Pay is not configured",
        [Language.swedish]: "Swedbank Pay är inte konfigurerad",
    },
    onlyPendingOrders: {
        [Language.english]: "Only pending orders can be paid for",
        [Language.swedish]: "Endast avvaktande beställningar kan betalas",
    },
    noPaymentInitiated: {
        [Language.english]: "No payment initiated for non-pending order",
        [Language.swedish]: "Ingen betalning initierad för icke avvaktande beställning",
    },
};

export default LanguageTranslations;
