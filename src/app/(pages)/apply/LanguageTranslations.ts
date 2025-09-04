import { Language } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";

const LanguageTranslations = {
    [GlobalConstants.APPLY]: {
        [Language.english]: "Submit application",
        [Language.swedish]: "Skicka in ansökan",
    },
    applicationSubmitted: {
        [Language.english]: "Application submitted",
        [Language.swedish]: "Ansökan skickad",
    },
    failedApplicationSubmit: {
        [Language.english]: "Failed to submit application",
        [Language.swedish]: "Kunde inte skicka in ansökan",
    },
};
export default LanguageTranslations;
