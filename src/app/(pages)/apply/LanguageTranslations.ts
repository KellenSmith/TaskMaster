import { Language } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";

const LanguageTranslations = {
    [GlobalConstants.APPLY]: {
        [Language.english]: "Submit application",
        [Language.swedish]: "Skicka in ansökan",
    },
    applicationSubmitted: {
        [Language.english]:
            "Application submitted. A login link will arrive in your email shortly.",
        [Language.swedish]:
            "Ansökan skickad. En inloggningslänk skickas till din e-postadress inom kort.",
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
