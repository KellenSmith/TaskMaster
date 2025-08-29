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
};

export default LanguageTranslations;
