import { Language, Prisma, UserRole } from "@prisma/client";
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
    membership: {
        [Language.english]: "Membership",
        [Language.swedish]: "Medlemskap",
    },
    expired: {
        [Language.english]: "Expired",
        [Language.swedish]: "Utgått",
    },
    active: {
        [Language.english]: "Active",
        [Language.swedish]: "Aktiv",
    },
    membershipExpiredPrompt: {
        [Language.english]: (
            user: Prisma.UserGetPayload<{
                include: { user_membership: true };
            }>,
        ) =>
            user.user_membership
                ? "Your membership has expired and needs renewal"
                : "Welcome! Activate your membership to get started",
        [Language.swedish]: (
            user: Prisma.UserGetPayload<{
                include: { user_membership: true };
            }>,
        ) =>
            user.user_membership
                ? "Ditt medlemskap har gått ut och behöver förnyas"
                : "Välkommen! Aktivera ditt medlemskap för att komma igång",
    },
    memberSince: {
        [Language.english]: "Member since",
        [Language.swedish]: "Medlem sedan",
    },
    membershipExpires: {
        [Language.english]: "Membership expires",
        [Language.swedish]: "Medlemskapet går ut",
    },
    role: {
        [Language.english]: "Role",
        [Language.swedish]: "Roll",
    },
    [UserRole.admin]: {
        [Language.english]: "Admin",
        [Language.swedish]: "Administratör",
    },
    [UserRole.member]: {
        [Language.english]: "Member",
        [Language.swedish]: "Medlem",
    },
};

export default LanguageTranslations;
