import { EventStatus, Language, Prisma, UserRole } from "@prisma/client";
import { isMembershipExpired } from "../../lib/utils";
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
    startMembershipSubscription: {
        [Language.english]: "Start membership subscription",
        [Language.swedish]: "Starta prenumeration för medlemskap",
    },
    failedStartMembershipSubscription: {
        [Language.english]: "Failed to start membership subscription",
        [Language.swedish]: "Kunde inte starta prenumeration för medlemskap",
    },
    cancelSubscription: {
        [Language.english]: "Cancel subscription",
        [Language.swedish]: "Avbryt prenumeration",
    },
    cancelledSubscription: {
        [Language.english]: "Subscription cancelled",
        [Language.swedish]: "Prenumeration avbruten",
    },
    failedCancelSubscription: {
        [Language.english]: "Failed to cancel subscription",
        [Language.swedish]: "Kunde inte avbryta prenumeration",
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
    membershipPendingPrompt: {
        [Language.english]: "Your membership is awaiting validation by an admin",
        [Language.swedish]: "Ditt medlemskap väntar på godkännande av en administratör",
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
    subscription: {
        [Language.english]: "Subscription",
        [Language.swedish]: "Prenumeration",
    },
    automaticallyExtendedOn: {
        [Language.english]: "Your membership will be automatically extended on the date: ",
        [Language.swedish]: "Ditt medlemskap kommer att förlängas automatiskt på datumet: ",
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
