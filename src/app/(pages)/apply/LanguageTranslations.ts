import { Language } from "../../../prisma/generated/enums";

const LanguageTranslations = {
    apply: {
        [Language.english]: "Submit application",
        [Language.swedish]: "Skicka in ansökan",
    },
    applicationSubmitted: {
        [Language.english]: "Application submitted",
        [Language.swedish]: "Ansökan skickad",
    },
    applicationSubmittedBody: {
        [Language.english]: (email: string) =>
            `We have sent a login link to ${email}. Use it to sign in and follow your application on your profile.`,
        [Language.swedish]: (email: string) =>
            `Vi har skickat en inloggningslänk till ${email}. Använd den för att logga in och följa din ansökan på din profil.`,
    },
    applicationReviewNote: {
        [Language.english]:
            "An admin will review your application. You will get an email when it has been approved. If no email arrives within a few minutes, check your spam folder.",
        [Language.swedish]:
            "En administratör granskar din ansökan. Du får ett mejl när den har godkänts. Kommer inget mejl inom några minuter, kontrollera din skräppost.",
    },
    failedApplicationSubmit: {
        [Language.english]:
            "Failed to submit application. For security reasons we do not disclose whether you are already a member or not. If you are already a member you can log in via the login page.",
        [Language.swedish]:
            "Kunde inte skicka in ansökan. Av säkerhetsskäl avslöjar vi inte om du redan är medlem eller inte. Om du redan är medlem kan du logga in via inloggningssidan.",
    },
    makeSureYouRead: {
        [Language.english]:
            "Please make sure you have read and understood the terms before submitting your application",
        [Language.swedish]:
            "Se till att du har läst och förstått villkoren innan du skickar in din ansökan",
    },
    termsOfMembership: {
        [Language.english]: "terms of Membership",
        [Language.swedish]: "medlemsvillkoren",
    },
};
export default LanguageTranslations;
