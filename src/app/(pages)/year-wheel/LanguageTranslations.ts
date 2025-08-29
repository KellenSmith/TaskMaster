import { Language } from "@prisma/client";

const LanguageTranslations = {
    currentEvents: {
        [Language.english]: "Current Events",
        [Language.swedish]: "Aktuella Evenemang",
    },
};

export default LanguageTranslations;
