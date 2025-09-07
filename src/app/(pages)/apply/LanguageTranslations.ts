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
};
export default LanguageTranslations;
