import { Language, Prisma } from "@prisma/client";
import { isMembershipExpired } from "../../lib/definitions";

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
    nonMatchingPasswords: {
        [Language.english]: "New password and repeat password do not match",
        [Language.swedish]: "Lösenord matchar inte",
    },
    activateMembership: {
        [Language.english]: (
            user: Prisma.UserGetPayload<{
                include: { user_membership: true };
            }>,
        ) => `${isMembershipExpired(user) ? "Activate" : "Extend"} membership`,
        [Language.swedish]: (
            user: Prisma.UserGetPayload<{
                include: { user_membership: true };
            }>,
        ) => `${isMembershipExpired(user) ? "Aktivera" : "Förläng"} medlemskap`,
    },
    failedActivateMembership: {
        [Language.english]: "Failed to activate membership",
        [Language.swedish]: "Misslyckades med att aktivera medlemskap",
    },
    deleteAccount: {
        [Language.english]: "Delete Account",
        [Language.swedish]: "Ta bort konto",
    },
};

export default LanguageTranslations;
