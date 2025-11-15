import { Language } from "@prisma/client";

const LanguageTranslations = {
    nickname: {
        [Language.english]: "Member nickname",
        [Language.swedish]: "Medlemmens smeknamn",
    },
    printReport: {
        [Language.english]: "Print Report",
        [Language.swedish]: "Skriv ut rapport",
    },
    product: {
        [Language.english]: "Product",
        [Language.swedish]: "Produkt",
    },
    quantity: {
        [Language.english]: "Quantity",
        [Language.swedish]: "Antal",
    },
    unitPrice: {
        [Language.english]: "Unit Price (incl. VAT)",
        [Language.swedish]: "Enhetspris (inkl. moms)",
    },
    vatPerUnit: {
        [Language.english]: "VAT/Unit",
        [Language.swedish]: "Moms/Enhet",
    },
    totalPrice: {
        [Language.english]: "Total (incl. VAT)",
        [Language.swedish]: "Totalt (inkl. moms)",
    },
    totalVat: {
        [Language.english]: "Total VAT",
        [Language.swedish]: "Total Moms",
    },
    reportPeriod: {
        [Language.english]: "Report Period:",
        [Language.swedish]: "Rapportperiod:",
    },
    allOrders: {
        [Language.english]: "All orders",
        [Language.swedish]: "Alla beställningar",
    },
    totalOrders: {
        [Language.english]: "Total Orders:",
        [Language.swedish]: "Totalt antal order:",
    },
    ordersReport: {
        [Language.english]: "Orders Report",
        [Language.swedish]: "Orderrapport",
    },
    printed: {
        [Language.english]: "Printed:",
        [Language.swedish]: "Utskrivet:",
    },
    noProductsFound: {
        [Language.english]: "No products found",
        [Language.swedish]: "Inga produkter hittades",
    },
    total: {
        [Language.english]: "TOTAL",
        [Language.swedish]: "TOTALT",
    },
};

export default LanguageTranslations;
