import { Language } from "@prisma/client";

export const implementedTabs = {
    details: "Details",
    location: "Location",
    organize: "Organize",
    tickets: "Tickets",
    participants: "Participants",
    reserveList: "Reserve List",
};

const LanguageTranslations = {
    [implementedTabs.details]: {
        [Language.english]: "Details",
        [Language.swedish]: "Detaljer",
    },
    [implementedTabs.location]: {
        [Language.english]: "Location",
        [Language.swedish]: "Plats",
    },
    [implementedTabs.organize]: {
        [Language.english]: "Organize",
        [Language.swedish]: "Organisera",
    },
    [implementedTabs.tickets]: {
        [Language.english]: "Tickets",
        [Language.swedish]: "Biljetter",
    },
    [implementedTabs.participants]: {
        [Language.english]: "Participants",
        [Language.swedish]: "Deltagare",
    },
    [implementedTabs.reserveList]: {
        [Language.english]: "Reserve List",
        [Language.swedish]: "Reservlista",
    },
    eventDraftNote: {
        [Language.english]: "This is an event draft and is only visible to the host",
        [Language.swedish]: "Detta är ett utkast och är bara synligt för värden",
    },
    cancelled: {
        [Language.english]: "Cancelled",
        [Language.swedish]: "Inställt",
    },
    start: {
        [Language.english]: "Start",
        [Language.swedish]: "Start",
    },
    end: {
        [Language.english]: "End",
        [Language.swedish]: "Slut",
    },
    noLocationInfo: {
        [Language.english]: "No location information available",
        [Language.swedish]: "Ingen platsinformation tillgänglig",
    },
    switchEventLocation: {
        [Language.english]: "Switch Event Location",
        [Language.swedish]: "Byt Evenemangets Plats",
    },
    failedTicketOrder: {
        [Language.english]: "Failed to create ticket order",
        [Language.swedish]: "Misslyckades med att skapa biljettbeställning",
    },
    tickets: {
        [Language.english]: "Tickets",
        [Language.swedish]: "Biljetter",
    },
    addTicket: {
        [Language.english]: "Add Ticket",
        [Language.swedish]: "Lägg till Biljett",
    },
    noTickets: {
        [Language.english]: "No tickets available",
        [Language.swedish]: "Inga biljetter tillgängliga",
    },
    unlockVolunteerTicket: {
        [Language.english]: "Unlock the volunteer ticket by helping organize the event",
        [Language.swedish]:
            "Lås upp volontärbiljetten genom att hjälpa till att organisera evenemanget",
    },
    host: {
        [Language.english]: "Host",
        [Language.swedish]: "Värd",
    },
    leftEvent: {
        [Language.english]: "You have left the event",
        [Language.swedish]: "Du har lämnat evenemanget",
    },
    failedToLeaveEvent: {
        [Language.english]: "Failed to leave the event",
        [Language.swedish]: "Kunde inte lämna evenemanget",
    },
    registered: {
        [Language.english]: "Registered",
        [Language.swedish]: "Registrerad",
    },
    allSet: {
        [Language.english]: "You're All Set!",
        [Language.swedish]: "Allt klart!",
    },
    youHaveATicket: {
        [Language.english]: "You have a ticket to this event. See you there!",
        [Language.swedish]: "Du har en biljett till detta evenemang. Syns där!",
    },
    cantMakeIt: {
        [Language.english]: "Can't make it after all?",
        [Language.swedish]: "Kan inte komma trots allt?",
    },
    leaveToFreeUpSpot: {
        [Language.english]: "Leave the participant list to free up your spot for someone else.",
        [Language.swedish]: "Lämna deltagarlistan för att ge din plats till någon annan.",
    },
    leaveParticipantList: {
        [Language.english]: "Leave Participant List",
        [Language.swedish]: "Lämna Deltagarlistan",
    },
    sureYouWannaLeave: {
        [Language.english]:
            "Are you sure you want to leave this event? This action cannot be undone and you will lose your spot.",
        [Language.swedish]:
            "Är du säker på att du vill lämna detta evenemang? Denna åtgärd kan inte ångras och du kommer att förlora din plats.",
    },
    joinedReserveList: {
        [Language.english]: "You have joined the reserve list.",
        [Language.swedish]: "Du har gått med i reservlistan.",
    },
    failedToAddReserve: {
        [Language.english]: "Failed to add you to the reserve list.",
        [Language.swedish]: "Kunde inte lägga till dig i reservlistan.",
    },
    leftReserveList: {
        [Language.english]: "You have left the reserve list.",
        [Language.swedish]: "Du har lämnat reservlistan.",
    },
    failedToLeaveReserve: {
        [Language.english]: "Failed to leave the reserve list.",
        [Language.swedish]: "Kunde inte lämna reservlistan.",
    },
    notifyIfSpotOpens: {
        [Language.english]: "You'll be notified if a spot opens up.",
        [Language.swedish]: "Du kommer att meddelas om en plats blir ledig.",
    },
    sorrySoldOut: {
        [Language.english]: (isReserve: boolean) =>
            isReserve ? "You're on the Reserve List!" : "Sorry, this event is sold out",
        [Language.swedish]: (isReserve: boolean) =>
            isReserve ? "Du är på reservlistan!" : "Tyvärr, detta evenemang är slutsålt.",
    },
    joinReserveToBeNotified: {
        [Language.english]: (isReserve: boolean) =>
            isReserve
                ? "Leave the reserve list to stop receiving notifications."
                : "Join the reserve list to be notified if a spot opens up for this event.",
        [Language.swedish]: (isReserve: boolean) =>
            isReserve
                ? "Lämna reservlistan för att sluta få meddelanden."
                : "Gå med i reservlistan för att bli meddelad om en plats blir ledig.",
    },
    areYouSureYouWannaJoin: {
        [Language.english]: (isReserve: boolean) =>
            isReserve
                ? "Are you sure you want to leave the reserve list? You will not be notified if a spot opens up."
                : "Are you sure you want to join the reserve list? You'll be notified if a spot opens up.",
        [Language.swedish]: (isReserve: boolean) =>
            isReserve
                ? "Är du säker på att du vill lämna reservlistan? Du kommer inte att meddelas om en plats blir ledig."
                : "Är du säker på att du vill gå med i reservlistan? Du kommer att meddelas om en plats blir ledig.",
    },
    joinReserveButtonLabel: {
        [Language.english]: (isReserve: boolean) =>
            isReserve ? "Leave Reserve List" : "Join Reserve List",
        [Language.swedish]: (isReserve: boolean) =>
            isReserve ? "Lämna Reservlistan" : "Gå med i Reservlistan",
    },
};

export default LanguageTranslations;
