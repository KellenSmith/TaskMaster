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
        [Language.swedish]: "Misslyckades med att spara",
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
        [Language.swedish]: "Misslyckades med att ta bort",
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
