import { Language } from "../../../prisma/generated/enums";

const LanguageTranslations = {
    validateMembership: {
        [Language.english]: "Validate membership",
        [Language.swedish]: "Validera medlemskap",
    },
    validatedMembership: {
        [Language.english]: "Validated membership",
        [Language.swedish]: "Validerat medlemskap",
    },
    failedValidatedMembership: {
        [Language.english]: "Failed validating membership",
        [Language.swedish]: "Kunde inte validera medlemskap",
    },
    addMembership: {
        [Language.english]: "Add membership",
        [Language.swedish]: "Lägg till medlemskap",
    },
    changeMembership: {
        [Language.english]: "Change membership",
        [Language.swedish]: "Ändra medlemskap",
    },
    blacklistMember: {
        [Language.english]: "Blacklist member",
        [Language.swedish]: "Svartlista medlem",
    },
    blacklistedMember: {
        [Language.english]: "Blacklisted member",
        [Language.swedish]: "Svartlistade medlem",
    },
    failedBlacklistedMember: {
        [Language.english]: "Failed to blacklist member",
        [Language.swedish]: "Kunde inte svartlista medlem",
    },
    deleteBlacklistEntry: {
        [Language.english]: "Delete blacklist entry",
        [Language.swedish]: "Ta bort svartlistning",
    },
    deletedBlacklistEntry: {
        [Language.english]: "Deleted blacklist entry",
        [Language.swedish]: "Svartlistning borttagen",
    },
    failedDeletedBlacklistEntry: {
        [Language.english]: "Failed to delete blacklist entry",
        [Language.swedish]: "Kunde inte ta bort svartlistning",
    },
    addedMembership: {
        [Language.english]: "Added membership",
        [Language.swedish]: "Lagt till medlemskap",
    },
    failedAddedMembership: {
        [Language.english]: "Failed adding membership",
        [Language.swedish]: "Kunde inte lägga till medlemskap",
    },
    printMembersList: {
        [Language.english]: "Print filtered members list",
        [Language.swedish]: "Skriv ut filtrerad medlemslista",
    },
    sendEmail: {
        [Language.english]: "Send email to filtered members",
        [Language.swedish]: "Skicka email till filtrerade medlemmar",
    },
};

export default LanguageTranslations;
