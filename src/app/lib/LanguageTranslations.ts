import { Language } from "../../prisma/generated/enums";

const LanguageTranslations = {
    eventParticipantNotFound: {
        [Language.english]: "Event participant not found",
        [Language.swedish]: "Evenemangsdeltagare hittades inte",
    },
    alreadyCheckedIn: {
        [Language.english]: "Already checked in at",
        [Language.swedish]: "Redan checkat in vid",
    },
}

export default LanguageTranslations;
