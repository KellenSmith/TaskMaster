import { Language } from "../../../prisma/generated/enums"

const LanguageTranslations = {
    ticketNotFound: {
        [Language.english]: "Ticket not found",
        [Language.swedish]: "Biljett hittades inte",
    },
    ticketNorFoundDetails: {
        [Language.english]: "We could not find a ticket for the provided ID. Please check the link and try again.",
        [Language.swedish]: "Vi kunde inte hitta en biljett för det angivna ID:t. Kontrollera länken och försök igen.",
    },
    missingData: {
        [Language.english]: "Missing data",
        [Language.swedish]: "Data saknas",
    },
    valid: {
        [Language.english]: "Valid",
        [Language.swedish]: "Giltig",
    },
    eventNotOngoing: {
        [Language.english]: "Not ongoing",
        [Language.swedish]: "Pågår ej",
    },
    thisIsATicket: {
        [Language.english]: `This is a ${process.env.NEXT_PUBLIC_ORG_NAME} ticket! Below are the details we have on record for this ticket.`,
        [Language.swedish]: `Detta är en biljett från ${process.env.NEXT_PUBLIC_ORG_NAME}! Nedan finns de uppgifter vi har registrerade för denna biljett.`,
    },
    eventTitleMissing: {
        [Language.english]: "Event title missing",
        [Language.swedish]: "Evenemangstitel saknas",
    },
    startMissing: {
        [Language.english]: "Start time missing",
        [Language.swedish]: "Starttid saknas",
    },
    endMissing: {
        [Language.english]: "End time missing",
        [Language.swedish]: "Sluttid saknas",
    },
    userNicknameMissing: {
        [Language.english]: "User nickname missing",
        [Language.swedish]: "Användarnamn saknas",
    },
    ticketTypeMissing: {
        [Language.english]: "Ticket type missing",
        [Language.swedish]: "Biljettyp saknas",
    },
    ticketScanInfo: {
        [Language.english]: "If this ticket is scanned within one hour of the event duration the member will be checked in and the ticket voided.",
        [Language.swedish]: "Om denna biljett skannas inom en timme från evenemangets öppettider kommer medlemmen att checkas in och biljetten bli ogiltig."
    },
    belongsTo: {
        [Language.english]: "Belongs to",
        [Language.swedish]: "Tillhör",
    },
    ticketType: {
        [Language.english]: "Ticket type",
        [Language.swedish]: "Biljettyp",
    },
    checkInFailed: {
        [Language.english]: "Check-in failed",
        [Language.swedish]: "Incheckning misslyckades",
    },
}

export default LanguageTranslations
