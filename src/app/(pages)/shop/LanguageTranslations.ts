import { Language } from "../../../prisma/generated/enums";

const LanguageTranslations = {
    shop: {
        [Language.english]: "Shop",
        [Language.swedish]: "Butik",
    },
    shopTabs: {
        [Language.english]: "shop tabs",
        [Language.swedish]: "butiksflikar",
    },
    memberships: {
        [Language.english]: "Memberships",
        [Language.swedish]: "Medlemskap",
    },
    merch: {
        [Language.english]: "Merch",
        [Language.swedish]: "Merch",
    },
    noProducts: {
        [Language.english]: "No products available",
        [Language.swedish]: "Inga produkter tillgängliga",
    },
    addMembership: {
        [Language.english]: "Add membership",
        [Language.swedish]: "Lägg till medlemskap",
    },
    addProduct: {
        [Language.english]: "Add product",
        [Language.swedish]: "Lägg till produkt",
    },
    failedCreateOrder: {
        [Language.english]: "Failed to create order",
        [Language.swedish]: "Kunde inte skapa order",
    },
};

export default LanguageTranslations;
