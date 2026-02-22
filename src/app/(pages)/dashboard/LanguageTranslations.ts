import { Language } from "../../../prisma/generated/enums";

const LanguageTranslations = {
    qrImageAlt: {
        [Language.english]: "QR code for ticket",
        [Language.swedish]: "QR-kod för biljett",
    },
    welcomeBack: {
        [Language.english]: "Welcome back",
        [Language.swedish]: "Välkommen tillbaka",
    },
    upcomingEventTickets: {
        [Language.english]: "Tickets for upcoming events",
        [Language.swedish]: "Biljetter för kommande evenemang",
    },
    checkCalendarForEvents: {
        [Language.english]: "You have no tickets. Check the calendar for upcoming events.",
        [Language.swedish]: "Du har inga biljetter. Kolla kalendern för kommande evenemang.",
    },
};

export default LanguageTranslations;
