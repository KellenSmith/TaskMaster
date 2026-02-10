import { Language } from "../../prisma/generated/enums";

const LanguageTranslations = {
    eventParticipantNotFound: {
        [Language.english]: "Event participant not found",
        [Language.swedish]: "Evenemangsdeltagare hittades inte",
    },
    alreadyCheckedIn: {
        [Language.english]: "Already checked in",
        [Language.swedish]: "Du har redan checkat in",
    },
}

export default LanguageTranslations;
