import { Language } from "@prisma/client";

const GlobalLanguageTranslations = {
    save: {
        [Language.english]: "Save",
        [Language.swedish]: "Spara",
    },
    successfulSave: {
        [Language.english]: "Saved",
        [Language.swedish]: "Sparat",
    },
    failedSave: {
        [Language.english]: "Failed to save",
        [Language.swedish]: "Kunde inte spara",
    },
    edit: {
        [Language.english]: "Edit",
        [Language.swedish]: "Redigera",
    },
    delete: {
        [Language.english]: "Delete",
        [Language.swedish]: "Ta bort",
    },
    successfulDelete: {
        [Language.english]: "Deleted",
        [Language.swedish]: "Borttagen",
    },
    failedDelete: {
        [Language.english]: "Failed to delete",
        [Language.swedish]: "Kunde inte ta bort",
    },
    cancel: {
        [Language.english]: "Cancel",
        [Language.swedish]: "Avbryt",
    },
    open: {
        [Language.english]: "Open",
        [Language.swedish]: "Öppna",
    },
    close: {
        [Language.english]: "Close",
        [Language.swedish]: "Stäng",
    },
};

export default GlobalLanguageTranslations;
