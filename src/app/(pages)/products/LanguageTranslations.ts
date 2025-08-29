import { Language } from "@prisma/client";

const LanguageTranslations = {
    price: {
        [Language.english]: "Price",
        [Language.swedish]: "Pris",
    },
    quantity: {
        [Language.english]: "Quantity",
        [Language.swedish]: "Antal",
    },
    total: {
        [Language.english]: "Total",
        [Language.swedish]: "Summa",
    },
};

export default LanguageTranslations;
