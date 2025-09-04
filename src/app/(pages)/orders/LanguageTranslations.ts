import { Language } from "@prisma/client";

const LanguageTranslations = {
    nickname: {
        [Language.english]: "Member nickname",
        [Language.swedish]: "Medlemmens smeknamn",
    },
};

export default LanguageTranslations;
