import { Language, OrderStatus, Prisma } from "@prisma/client";

const LanguageTranslations = {
    failedCheckOrderStatus: {
        [Language.english]:
            "Thank you for your order! Your payment has been processed and your order is complete",
        [Language.swedish]:
            "Misslyckades med att kontrollera orderstatus. Det du ser kanske inte är aktuellt",
    },
    orderCompleted: {
        [Language.english]:
            "Thank you for your order! Your payment has been processed and your order is complete",
        [Language.swedish]:
            "Tack för din beställning! Din betalning har behandlats och din beställning är slutförd",
    },
    orderPaid: {
        [Language.english]:
            "Thank you for your order! Your payment has been processed and is being fulfilled",
        [Language.swedish]:
            "Tack för din beställning! Din betalning har behandlats och håller på att uppfyllas",
    },
    orderId: {
        [Language.english]: "Order ID",
        [Language.swedish]: "Order ID",
    },
    orderPending: {
        [Language.english]: "Your order is currently pending payment",
        [Language.swedish]: "Din beställning väntar på betalning",
    },
    orderCancelled: {
        [Language.english]:
            "This order has been cancelled. If you have any questions, please contact support",
        [Language.swedish]:
            "Beställning har avbrutits. Om du har några frågor, vänligen kontakta support",
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
    total: {
        [Language.english]: "Total",
        [Language.swedish]: "Summa",
    },
    product: {
        [Language.english]: "Product",
        [Language.swedish]: "Produkt",
    },
    failedPaymentRedirect: {
        [Language.english]: "Failed to redirect to payment",
        [Language.swedish]: "Kunde inte omdirigera till betalning",
    },
    cancelledOrder: {
        [Language.english]: "Cancelled order",
        [Language.swedish]: "Avbröt beställningen",
    },
    pay: {
        [Language.english]: (orderTotal: number) => (orderTotal === 0 ? "confirm" : "pay"),
        [Language.swedish]: (orderTotal: number) => (orderTotal === 0 ? "bekräfta" : "betala"),
    },
    termsRequired: {
        [Language.english]: "You must accept the terms of purchase to continue",
        [Language.swedish]: "Du måste acceptera köpvillkoren för att fortsätta",
    },
    iHaveRead: {
        [Language.english]: "I have read and agree to the",
        [Language.swedish]: "Jag har läst och godkänner",
    },
    termsOfPurchase: {
        [Language.english]: "terms of purchase",
        [Language.swedish]: "köpvillkoren",
    },
    privacyPolicy: {
        [Language.english]: "privacy policy",
        [Language.swedish]: "integritetspolicyn",
    },
    subscribe: {
        [Language.english]: "Subscribe to membership",
        [Language.swedish]: "Prenumerera på medlemskap",
    },
    subscribeToMembership: {
        [Language.english]: (organizationSettings: Prisma.OrganizationSettingsGetPayload<true>) =>
            `Do you want to subscribe to the following membership? We will automatically extend your membership ${organizationSettings.remind_membership_expires_in_days} days before it expires so you will never lose access to ${process.env.NEXT_PUBLIC_ORG_NAME}.`,
        [Language.swedish]: (organizationSettings: Prisma.OrganizationSettingsGetPayload<true>) =>
            `Vill du prenumerera på följande medlemskap? Vi kommer automatiskt att förlänga ditt medlemskap ${organizationSettings.remind_membership_expires_in_days} dagar innan det går ut så att du aldrig förlorar tillgången till ${process.env.NEXT_PUBLIC_ORG_NAME}.`,
    },
    ifYouDontWantToSubscribeAtAll: {
        [Language.english]:
            "If you don't want to subscribe at all, we will remind you when your membership is about to expire.",
        [Language.swedish]:
            "Om du inte vill prenumerera kommer vi att påminna dig när ditt medlemskap är på väg att gå ut.",
    },
    yesSubscribe: {
        [Language.english]: "Yes, subscribe!",
        [Language.swedish]: "Ja, prenumerera!",
    },
    greatChoice: {
        [Language.english]:
            "Great! Your membership will be renewed automatically before it expires. You can manage your subscription anytime from your profile settings.",
        [Language.swedish]:
            "Toppen! Ditt medlemskap kommer att förnyas automatiskt innan det går ut. Du kan hantera din prenumeration när som helst från dina profilsinställningar.",
    },
};

export default LanguageTranslations;
