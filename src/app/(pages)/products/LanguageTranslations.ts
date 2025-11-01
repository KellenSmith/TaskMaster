import { Language, Prisma } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";

const LanguageTranslations = {
    [GlobalConstants.PRICE]: {
        [Language.english]: "Price",
        [Language.swedish]: "Pris",
    },
    [GlobalConstants.VAT_AMOUNT]: {
        [Language.english]: "VAT",
        [Language.swedish]: "Moms",
    },
    [GlobalConstants.TOTAL_VAT_AMOUNT]: {
        [Language.english]: "Total VAT",
        [Language.swedish]: "Total Moms",
    },
    [GlobalConstants.STOCK]: {
        [Language.english]: "Stock",
        [Language.swedish]: "Lager",
    },
    [GlobalConstants.UNLIMITED_STOCK]: {
        [Language.english]: "Unlimited Stock",
        [Language.swedish]: "Obegränsat Lager",
    },
    [GlobalConstants.QUANTITY]: {
        [Language.english]: "Quantity",
        [Language.swedish]: "Antal",
    },
    [GlobalConstants.TOTAL]: {
        [Language.english]: "Total",
        [Language.swedish]: "Summa",
    },
    inStock: {
        [Language.english]: "In Stock",
        [Language.swedish]: "I Lager",
    },
    outOfStock: {
        [Language.english]: "Out of Stock",
        [Language.swedish]: "Slut i Lager",
    },
    left: {
        [Language.english]: "left",
        [Language.swedish]: "kvar",
    },
    buyButtonLabel: {
        [Language.english]: (product: Prisma.ProductGetPayload<true>) =>
            product.price === 0 ? "claim" : "buy",
        [Language.swedish]: (product: Prisma.ProductGetPayload<true>) =>
            product.price === 0 ? "haffa" : "köp",
    },
};

export default LanguageTranslations;
