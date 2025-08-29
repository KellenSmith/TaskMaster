import { Language } from "@prisma/client";

export const implementedTabs = {
    account: "Account",
    events: "Events",
    tasks: "Tasks",
    skill_badges: "Skill Badges",
};

const LanguageTranslations = {
    // Avaliable tabs
    [implementedTabs.account]: {
        [Language.english]: "Account",
        [Language.swedish]: "Konto",
    },
    [implementedTabs.events]: {
        [Language.english]: "Events",
        [Language.swedish]: "Evenemang",
    },
    [implementedTabs.tasks]: {
        [Language.english]: "Tasks",
        [Language.swedish]: "Uppgifter",
    },
    [implementedTabs.skill_badges]: {
        [Language.english]: "Skill Badges",
        [Language.swedish]: "Kompetensdiplom",
    },
};

export default LanguageTranslations;
