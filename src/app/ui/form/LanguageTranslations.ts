import { Language } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";

export const organizationSettingsFieldLabels = {
    // Organization settings
    [GlobalConstants.ORGANIZATION_SETTINGS]: {
        [Language.english]: "Settings",
        [Language.swedish]: "Inställningar",
    },
    [GlobalConstants.ORGANIZATION_NAME]: {
        [Language.english]: "Organization Name",
        [Language.swedish]: "Organisationsnamn",
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
        [Language.english]: "Send us a message",
        [Language.swedish]: "Skicka oss ett meddelande",
    },
};

export const userFieldLabels = {
    [GlobalConstants.USER]: {
        [Language.english]: "User",
        [Language.swedish]: "Användare",
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
    [GlobalConstants.PASSWORD]: {
        [Language.english]: "Password",
        [Language.swedish]: "Lösenord",
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
};
