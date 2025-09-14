import { Language, OrderStatus, TaskStatus, TicketType, UserRole } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";
import ProductLanguageTranslations from "../../(pages)/products/LanguageTranslations";
import LanguageTranslations from "../../(pages)/profile/LanguageTranslations";

export const organizationSettingsFieldLabels = {
    // Organization settings
    [GlobalConstants.ORGANIZATION_SETTINGS]: {
        [Language.english]: "Settings",
        [Language.swedish]: "Inställningar",
    },
    [GlobalConstants.LOGO_URL]: {
        [Language.english]: "Upload logo",
        [Language.swedish]: "Ladda upp logga",
    },
    [GlobalConstants.DEFAULT_TASK_SHIFT_LENGTH]: {
        [Language.english]: "Default Task Shift Length [hours]",
        [Language.swedish]: "Standard uppgiftsskiftlängd [timmar]",
    },
    [GlobalConstants.REMIND_MEMBERSHIP_EXPIRES_IN_DAYS]: {
        [Language.english]: "Remind before membership expires [days]",
        [Language.swedish]: "Påminn innan medlemskapet går ut [dagar]",
    },
    [GlobalConstants.PURGE_MEMBERS_AFTER_DAYS_UNVALIDATED]: {
        [Language.english]: "Purge members after time without validated membership [days]",
        [Language.swedish]: "Rensa medlemmar efter tid utan validerat medlemskap [dagar]",
    },
    [GlobalConstants.MEMBER_APPLICATION_PROMPT]: {
        [Language.english]: "Motivation",
        [Language.swedish]: "Motivering",
    },
    [GlobalConstants.EVENT_MANAGER_EMAIL]: {
        [Language.english]: "Event Manager Email",
        [Language.swedish]: "Eventkoordinatorns e-post",
    },
    [GlobalConstants.PRIMARY_COLOR]: {
        [Language.english]: "Primary Color (Hex)",
        [Language.swedish]: "Primärfärg (Hex)",
    },
    [GlobalConstants.PRIVACY_POLICY_SWEDISH_URL]: {
        [Language.english]: "Privacy Policy (Swedish)",
        [Language.swedish]: "Integritetspolicy (Svenska)",
    },
    [GlobalConstants.PRIVACY_POLICY_ENGLISH_URL]: {
        [Language.english]: "Privacy Policy (English)",
        [Language.swedish]: "Integritetspolicy (Engelska)",
    },
    [GlobalConstants.TERMS_OF_PURCHASE_SWEDISH_URL]: {
        [Language.english]: "Terms of Purchase (Swedish)",
        [Language.swedish]: "Köpvillkor (Svenska)",
    },
    [GlobalConstants.TERMS_OF_PURCHASE_ENGLISH_URL]: {
        [Language.english]: "Terms of Purchase (English)",
        [Language.swedish]: "Köpvillkor (Engelska)",
    },
    [GlobalConstants.TERMS_OF_MEMBERSHIP_SWEDISH_URL]: {
        [Language.english]: "Terms of Membership (Swedish)",
        [Language.swedish]: "Medlemsvillkor (Svenska)",
    },
    [GlobalConstants.TERMS_OF_MEMBERSHIP_ENGLISH_URL]: {
        [Language.english]: "Terms of Membership (English)",
        [Language.swedish]: "Medlemsvillkor (Engelska)",
    },
};

export const textContentFieldLabels = {
    // Text content
    [GlobalConstants.TEXT_CONTENT]: {
        [Language.english]: "Text content",
        [Language.swedish]: "Textinnehåll",
    },
};

export const infoPageFieldLabels = {
    [GlobalConstants.INFO_PAGE]: {
        [Language.english]: "Info Page",
        [Language.swedish]: "Informationssida",
    },
    [GlobalConstants.LOWEST_ALLOWED_USER_ROLE]: {
        [Language.english]: "Lowest allowed user role",
        [Language.swedish]: "Lägsta tillåtna användarroll",
    },
};

export const userFieldLabels = {
    [GlobalConstants.USER]: {
        [Language.english]: "User",
        [Language.swedish]: "Användare",
    },
    [GlobalConstants.USER_ID]: {
        [Language.english]: "Member",
        [Language.swedish]: "Medlem",
    },
    [GlobalConstants.FIRST_NAME]: {
        [Language.english]: "First Name",
        [Language.swedish]: "Förnamn",
    },
    [GlobalConstants.SURNAME]: {
        [Language.english]: "Surname",
        [Language.swedish]: "Efternamn",
    },
    [GlobalConstants.NICKNAME]: {
        [Language.english]: "Nickname",
        [Language.swedish]: "Smeknamn",
    },
    [GlobalConstants.PRONOUN]: {
        [Language.english]: "Pronoun",
        [Language.swedish]: "Pronomen",
    },
    [GlobalConstants.EMAIL]: {
        [Language.english]: "Email",
        [Language.swedish]: "E-post",
    },
    [GlobalConstants.PHONE]: {
        [Language.english]: "Phone",
        [Language.swedish]: "Telefon",
    },
    [GlobalConstants.ROLE]: {
        [Language.english]: "Role",
        [Language.swedish]: "Roll",
    },
    [GlobalConstants.CREATED_AT]: {
        [Language.english]: "Created At",
        [Language.swedish]: "Skapad",
    },
    [GlobalConstants.UPDATED_AT]: {
        [Language.english]: "Updated At",
        [Language.swedish]: "Uppdaterad",
    },
    [GlobalConstants.CONSENT_TO_NEWSLETTERS]: {
        [Language.english]: "I consent to receiving newsletters",
        [Language.swedish]: "Jag samtycker till att ta emot nyhetsbrev",
    },
    [GlobalConstants.CONSENT_GDPR]: {
        [Language.english]: "I consent to being added to the member registry",
        [Language.swedish]: "Jag samtycker till att bli tillagd i medlemsregistret",
    },
    [GlobalConstants.PENDING]: {
        [Language.english]: "Pending",
        [Language.swedish]: "Väntande",
    },
    [GlobalConstants.ACTIVE]: {
        [Language.english]: "Active",
        [Language.swedish]: "Aktiv",
    },
    [GlobalConstants.EXPIRED]: {
        [Language.english]: "Expired",
        [Language.swedish]: "Utgått",
    },
    [GlobalConstants.EXPIRES_AT]: {
        [Language.english]: "Expires At",
        [Language.swedish]: "Utgår Datum",
    },
    [UserRole.admin]: LanguageTranslations.admin,
    [UserRole.member]: LanguageTranslations.member,
};

export const eventFieldLabels = {
    [GlobalConstants.TITLE]: {
        [Language.english]: "Title",
        [Language.swedish]: "Titel",
    },
    [GlobalConstants.LOCATION_ID]: {
        [Language.english]: "Location",
        [Language.swedish]: "Plats",
    },
    [GlobalConstants.START_TIME]: {
        [Language.english]: "Start time",
        [Language.swedish]: "Starttid",
    },
    [GlobalConstants.END_TIME]: {
        [Language.english]: "End time",
        [Language.swedish]: "Sluttid",
    },
    [GlobalConstants.MAX_PARTICIPANTS]: {
        [Language.english]: "Maximum no. of participants",
        [Language.swedish]: "Max antal deltagare",
    },
    [GlobalConstants.DESCRIPTION]: {
        [Language.english]: "Description",
        [Language.swedish]: "Beskrivning",
    },
    [GlobalConstants.HOST]: {
        [Language.english]: "Host",
        [Language.swedish]: "Värd",
    },
    [GlobalConstants.PARTICIPANT_USERS]: {
        [Language.english]: "Participants",
        [Language.swedish]: "Deltagare",
    },
    [GlobalConstants.RESERVE_USERS]: {
        [Language.english]: "Reserves",
        [Language.swedish]: "Reserver",
    },
    [GlobalConstants.ARRIVED]: {
        [Language.english]: "Arrived",
        [Language.swedish]: "Anlänt",
    },
};

export const locationFieldLabels = {
    [GlobalConstants.NAME]: {
        [Language.english]: "Name",
        [Language.swedish]: "Namn",
    },
    [GlobalConstants.CONTACT_PERSON]: {
        [Language.english]: "Contact Person",
        [Language.swedish]: "Kontaktperson",
    },
    [GlobalConstants.RENTAL_COST]: {
        [Language.english]: "Rental Cost [SEK]",
        [Language.swedish]: "Hyreskostnad [SEK]",
    },
    [GlobalConstants.ADDRESS]: {
        [Language.english]: "Address",
        [Language.swedish]: "Adress",
    },
    [GlobalConstants.CAPACITY]: {
        [Language.english]: "Capacity [# people]",
        [Language.swedish]: "Kapacitet [# personer]",
    },
    [GlobalConstants.ACCESSIBILITY_INFO]: {
        [Language.english]: "Accessibility Info",
        [Language.swedish]: "Tillgänglighetsinformation",
    },
    [GlobalConstants.DESCRIPTION]: {
        [Language.english]: "Description",
        [Language.swedish]: "Beskrivning",
    },
};

export const taskFieldLabels = {
    [GlobalConstants.NAME]: {
        [Language.english]: "Name",
        [Language.swedish]: "Namn",
    },
    [GlobalConstants.STATUS]: {
        [Language.english]: "Status",
        [Language.swedish]: "Status",
    },
    [TaskStatus.toDo]: {
        [Language.english]: "To Do",
        [Language.swedish]: "Att Göra",
    },
    [TaskStatus.inProgress]: {
        [Language.english]: "In Progress",
        [Language.swedish]: "Pågående",
    },
    [TaskStatus.inReview]: {
        [Language.english]: "In Review",
        [Language.swedish]: "Under Granskning",
    },
    [TaskStatus.done]: {
        [Language.english]: "Done",
        [Language.swedish]: "Färdig",
    },
    [GlobalConstants.ASSIGNEE_ID]: {
        [Language.english]: "Assignee",
        [Language.swedish]: "Tilldelad",
    },
    [GlobalConstants.REVIEWER_ID]: {
        [Language.english]: "Reviewer",
        [Language.swedish]: "Granskare",
    },
    [GlobalConstants.START_TIME]: {
        [Language.english]: "Start time",
        [Language.swedish]: "Starttid",
    },
    [GlobalConstants.END_TIME]: {
        [Language.english]: "End time",
        [Language.swedish]: "Sluttid",
    },
    [GlobalConstants.TAGS]: {
        [Language.english]: "Tags",
        [Language.swedish]: "Taggar",
    },
    [GlobalConstants.SKILL_BADGES]: {
        [Language.english]: "Skill Badges",
        [Language.swedish]: "Kompetensdiplom",
    },
    [GlobalConstants.DESCRIPTION]: {
        [Language.english]: "Description",
        [Language.swedish]: "Beskrivning",
    },
};

export const sendoutFieldLabels = {
    [GlobalConstants.SUBJECT]: {
        [Language.english]: "Subject",
        [Language.swedish]: "Ämne",
    },
    [GlobalConstants.CONTENT]: {
        [Language.english]: "Content",
        [Language.swedish]: "Innehåll",
    },
};

export const productFieldLabels = {
    [GlobalConstants.PRICE]: ProductLanguageTranslations.price,
    [GlobalConstants.STOCK]: ProductLanguageTranslations.stock,
    [GlobalConstants.UNLIMITED_STOCK]: ProductLanguageTranslations[GlobalConstants.UNLIMITED_STOCK],
    [GlobalConstants.IMAGE_URL]: {
        [Language.english]: "Image",
        [Language.swedish]: "Bild",
    },
    [GlobalConstants.DURATION]: {
        [Language.english]: "Duration [days]",
        [Language.swedish]: "Giltighetsperiod [dagar]",
    },
};

export const ticketFieldLabels = {
    [GlobalConstants.TICKET_ID]: {
        [Language.english]: "Ticket",
        [Language.swedish]: "Biljett",
    },
    [GlobalConstants.TICKET_TYPE]: {
        [Language.english]: "Ticket Type",
        [Language.swedish]: "Biljettyp",
    },
    [TicketType.standard]: {
        [Language.english]: "Standard Ticket",
        [Language.swedish]: "Standardbiljett",
    },
    [TicketType.volunteer]: {
        [Language.english]: "Volunteer Ticket",
        [Language.swedish]: "Volontärbiljett",
    },
};

export const skillBadgeFieldLabels = {
    [GlobalConstants.NAME]: {
        [Language.english]: "Name",
        [Language.swedish]: "Namn",
    },
    [GlobalConstants.DESCRIPTION]: {
        [Language.english]: "Description",
        [Language.swedish]: "Beskrivning",
    },
};

export const orderFieldLabels = {
    [GlobalConstants.TOTAL_AMOUNT]: {
        [Language.english]: "Total amount",
        [Language.swedish]: "Total summa",
    },
    [GlobalConstants.PAYMENT_REQUEST_ID]: {
        [Language.english]: "Payment Request ID",
        [Language.swedish]: "Betalningsbegäran ID",
    },
    [GlobalConstants.PAYEE_REF]: {
        [Language.english]: "Payee Reference",
        [Language.swedish]: "Betalningsmottagare Referens",
    },
    [OrderStatus.pending]: {
        [Language.english]: "Pending",
        [Language.swedish]: "Avvaktande",
    },
    [OrderStatus.completed]: {
        [Language.english]: "Completed",
        [Language.swedish]: "Komplett",
    },
    [OrderStatus.cancelled]: {
        [Language.english]: "Cancelled",
        [Language.swedish]: "Avbruten",
    },
    [OrderStatus.error]: {
        [Language.english]: "Error",
        [Language.swedish]: "Error",
    },
};
