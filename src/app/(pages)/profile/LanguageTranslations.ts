import { Language, Prisma, UserRole } from "@prisma/client";
import { isMembershipExpired } from "../../lib/definitions";
import UILanguageTranslations from "../../ui/LanguageTranslations";
import GlobalConstants from "../../GlobalConstants";

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
        [Language.english]: "To do",
        [Language.swedish]: "Att göra",
    },
    [implementedTabs.skill_badges]: UILanguageTranslations.routeLabel[GlobalConstants.SKILL_BADGES],
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
        [Language.english]: "Expired membership",
        [Language.swedish]: "Medlemskap utgått",
    },
    active: {
        [Language.english]: "Active membership",
        [Language.swedish]: "Aktivt medlemskap",
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
    noEvents: {
        [Language.english]:
            "You are not participating in any events. Check the calendar to get involved!",
        [Language.swedish]:
            "Du deltar inte i några evenemang. Kolla kalendern för att engagera dig!",
    },
    eventHost: {
        [Language.english]: "Host",
        [Language.swedish]: "Värd",
    },
    participant: {
        [Language.english]: "Participant",
        [Language.swedish]: "Deltagare",
    },
    reserve: {
        [Language.english]: "Reserve",
        [Language.swedish]: "Reserv",
    },
    location: {
        [Language.english]: "Location",
        [Language.swedish]: "Plats",
    },
    seeEvent: {
        [Language.english]: "See event",
        [Language.swedish]: "Se evenemang",
    },
};

export default LanguageTranslations;
