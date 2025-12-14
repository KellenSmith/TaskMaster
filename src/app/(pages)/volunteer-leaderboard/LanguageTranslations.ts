import { Language } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";

const LanguageTranslations = {
    [GlobalConstants.VOLUNTEER_LEADERBOARD]: {
        [Language.english]: "Volunteer Leaderboard",
        [Language.swedish]: "Volontärtopplista",
    },
    rank: {
        [Language.english]: "Rank",
        [Language.swedish]: "Rankning",
    },
    nickname: {
        [Language.english]: "Nickname",
        [Language.swedish]: "Smeknamn",
    },
    hours: {
        [Language.english]: "Hours",
        [Language.swedish]: "Timmar",
    },
    prev: {
        [Language.english]: "Prev",
        [Language.swedish]: "Föregående",
    },
    next: {
        [Language.english]: "Next",
        [Language.swedish]: "Nästa",
    },
}

export default LanguageTranslations;
