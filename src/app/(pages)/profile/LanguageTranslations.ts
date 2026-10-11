import UILanguageTranslations from "../../ui/LanguageTranslations";
import GlobalConstants from "../../GlobalConstants";
import { EventStatus, Language, UserRole } from "../../../prisma/generated/enums";

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
    deleteAccount: {
        [Language.english]: "Delete Account",
        [Language.swedish]: "Ta bort konto",
    },
    membership: {
        [Language.english]: "Membership",
        [Language.swedish]: "Medlemskap",
    },
    pending: {
        [Language.english]: "Awaiting validation",
        [Language.swedish]: "Väntar på godkännande",
    },
    expired: {
        [Language.english]: "Expired membership",
        [Language.swedish]: "Medlemskap utgått",
    },
    active: {
        [Language.english]: "Active membership",
        [Language.swedish]: "Aktivt medlemskap",
    },
    expiresInDays: {
        [Language.english]: (days: number) => `Expires in ${days} ${days === 1 ? "day" : "days"}`,
        [Language.swedish]: (days: number) => `Går ut om ${days} ${days === 1 ? "dag" : "dagar"}`,
    },
    awaitingPayment: {
        [Language.english]: "Awaiting payment",
        [Language.swedish]: "Väntar på betalning",
    },
    membershipPendingPrompt: {
        [Language.english]: "Your membership is awaiting validation by an admin",
        [Language.swedish]: "Ditt medlemskap väntar på godkännande av en administratör",
    },
    membershipExpiredPrompt: {
        [Language.english]: "Your membership has expired and needs renewal",
        [Language.swedish]: "Ditt medlemskap har gått ut och behöver förnyas",
    },
    membershipActivatePrompt: {
        [Language.english]: "Welcome! Activate your membership to get started",
        [Language.swedish]: "Välkommen! Aktivera ditt medlemskap för att komma igång",
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
    [EventStatus.draft]: {
        [Language.english]: "Draft",
        [Language.swedish]: "Utkast",
    },
    [EventStatus.pending_approval]: {
        [Language.english]: "Pending Approval",
        [Language.swedish]: "Väntar på godkännande",
    },
    [EventStatus.cancelled]: {
        [Language.english]: "Cancelled",
        [Language.swedish]: "Inställt",
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
