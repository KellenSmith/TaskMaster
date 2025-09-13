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
        [Language.english]: "Failed to submit application",
        [Language.swedish]: "Kunde inte skicka in ansökan",
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
