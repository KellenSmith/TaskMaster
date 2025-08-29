import { Language } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";

const LanguageTranslations = {
    [GlobalConstants.APPLY]: {
        [Language.english]: "Submit application",
        [Language.swedish]: "Skicka in ansökan",
    },
};
export default LanguageTranslations;
