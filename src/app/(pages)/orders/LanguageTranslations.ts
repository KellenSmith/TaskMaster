import { Language } from "@prisma/client";

const LanguageTranslations = {
    nickname: {
        [Language.english]: "Member nickname",
        [Language.swedish]: "Medlemens smeksnamn",
    },
};

export default LanguageTranslations;
