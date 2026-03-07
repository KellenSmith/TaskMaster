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
    motivationRequired: {
        [Language.english]: "Motivation required.",
        [Language.swedish]: "Motivation obligatorisk.",
    },
    nicknameAlreadyExists: {
        [Language.english]: "A user with this nickname already exists.",
        [Language.swedish]: "En användare med detta smeknamn finns redan.",
    },
};

export default LanguageTranslations;
