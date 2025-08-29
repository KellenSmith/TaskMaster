import { Language, OrderStatus } from "@prisma/client";

const LanguageTranslations = {
    failedCheckOrderStatus: {
        [Language.english]:
            "Thank you for your order! Your payment has been processed and your order is complete.",
        [Language.swedish]:
            "Misslyckades med att kontrollera orderstatus. Det du ser kanske inte är aktuellt.",
    },
    orderCompleted: {
        [Language.english]:
            "Thank you for your order! Your payment has been processed and your order is complete.",
        [Language.swedish]:
            "Tack för din beställning! Din betalning har behandlats och din beställning är slutförd.",
    },
    orderPaid: {
        [Language.english]:
            "Thank you for your order! Your payment has been processed and is being fulfilled.",
        [Language.swedish]:
            "Tack för din beställning! Din betalning har behandlats och håller på att uppfyllas.",
    },
    orderPending: {
        [Language.english]:
            "Your order is currently pending payment. Please complete the payment process.",
        [Language.swedish]: "Din beställning behandlas. Vänligen slutför betalningsprocessen.",
    },
    orderCancelled: {
        [Language.english]:
            "This order has been cancelled. If you have any questions, please contact support.",
        [Language.swedish]:
            "Beställning har avbrutits. Om du har några frågor, vänligen kontakta support.",
    },
    unknownStatus: {
        [Language.english]: "Unknown status",
        [Language.swedish]: "Okänd status",
    },
    orderSummary: {
        [Language.english]: "Order Summary",
        [Language.swedish]: "Beställningsöversikt",
    },
    [OrderStatus.pending]: {
        [Language.english]: "Pending",
        [Language.swedish]: "Avvaktande",
    },
    [OrderStatus.paid]: {
        [Language.english]: "Paid",
        [Language.swedish]: "Betald",
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
    logInToSeeMembership: {
        [Language.english]: "Log in again to use your new membership",
        [Language.swedish]: "Logga in igen för att använda ditt nya medlemskap",
    },
    total: {
        [Language.english]: "Total",
        [Language.swedish]: "Summa",
    },
    product: {
        [Language.english]: "Product",
        [Language.swedish]: "Produkt",
    },
};

export default LanguageTranslations;
