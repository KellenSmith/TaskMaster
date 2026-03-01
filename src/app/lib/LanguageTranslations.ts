import { Language } from "../../prisma/generated/enums";

const LanguageTranslations = {
    unauthorized: {
        [Language.english]: "Unauthorized",
        [Language.swedish]: "Obehörig",
    },
    eventParticipantNotFound: {
        [Language.english]: "Event participant not found",
        [Language.swedish]: "Evenemangsdeltagare hittades inte",
    },
    alreadyCheckedIn: {
        [Language.english]: "Already checked in at",
        [Language.swedish]: "Redan checkat in vid",
    },
};

export default LanguageTranslations;
