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
