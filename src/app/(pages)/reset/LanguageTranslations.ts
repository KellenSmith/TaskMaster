import { Language } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";

const LanguageTranslations = {
    [GlobalConstants.RESET]: {
        [Language.english]: "Reset password",
        [Language.swedish]: "Återställ lösenord",
    },
};
export default LanguageTranslations;
