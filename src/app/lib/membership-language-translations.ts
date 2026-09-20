import { Language } from "../../prisma/generated/enums";

/**
 * Strings shared by every membership surface: the expiry banner, the appbar
 * CTAs, the ticket screen and the sign-up stepper. Kept in one file so the same
 * sentence is not written four times in four wordings.
 */
const MembershipLanguageTranslations = {
    renewMembership: {
        [Language.english]: "Renew membership",
        [Language.swedish]: "Förnya medlemskap",
    },
    activateMembership: {
        [Language.english]: "Activate membership",
        [Language.swedish]: "Aktivera medlemskap",
    },
    notEligible: {
        [Language.english]:
            "It is not possible to renew your membership at this time. If you believe this is a mistake, please contact us.",
        [Language.swedish]:
            "Det går inte att förnya ditt medlemskap just nu. Kontakta oss om du tror att detta är ett misstag.",
    },
    awaitingValidation: {
        [Language.english]: "Your application is awaiting approval by an admin.",
        [Language.swedish]: "Din ansökan väntar på godkännande av en administratör.",
    },
    failedStartRenewal: {
        [Language.english]: "Could not start the renewal. Please try again.",
        [Language.swedish]: "Kunde inte påbörja förnyelsen. Försök igen.",
    },
    expiresInDays: {
        [Language.english]: (days: number) =>
            days <= 0
                ? "Your membership expires today"
                : `Your membership expires in ${days} ${days === 1 ? "day" : "days"}`,
        [Language.swedish]: (days: number) =>
            days <= 0
                ? "Ditt medlemskap går ut idag"
                : `Ditt medlemskap går ut om ${days} ${days === 1 ? "dag" : "dagar"}`,
    },
    expiredOn: {
        [Language.english]: (date: string) => `Your membership expired on ${date}`,
        [Language.swedish]: (date: string) => `Ditt medlemskap gick ut den ${date}`,
    },
    admissionRequiresMembership: {
        [Language.english]: "An active membership is required for admission.",
        [Language.swedish]: "Ett aktivt medlemskap krävs för inträde.",
    },
    renewingExtendsFromExpiry: {
        [Language.english]:
            "Renewing early costs you nothing: the new period is added on top of your current expiry date.",
        [Language.swedish]:
            "Att förnya i förtid kostar dig ingenting: den nya perioden läggs till efter ditt nuvarande slutdatum.",
    },
    steps: {
        apply: {
            label: {
                [Language.english]: "Apply",
                [Language.swedish]: "Ansök",
            },
            hint: {
                [Language.english]: "Fill in the form",
                [Language.swedish]: "Fyll i formuläret",
            },
        },
        review: {
            label: {
                [Language.english]: "We review",
                [Language.swedish]: "Vi granskar",
            },
            hint: {
                [Language.english]: "A human checks your application",
                [Language.swedish]: "En människa granskar din ansökan",
            },
        },
        pay: {
            label: {
                [Language.english]: "Pay",
                [Language.swedish]: "Betala",
            },
            hint: {
                [Language.english]: "We invite you to pay",
                [Language.swedish]: "Vi bjuder in dig att betala",
            },
        },
        active: {
            label: {
                [Language.english]: "You're in",
                [Language.swedish]: "Du är med",
            },
            hint: {
                [Language.english]: "Book events and volunteer",
                [Language.swedish]: "Boka evenemang och engagera dig",
            },
        },
    },
} as const;

export default MembershipLanguageTranslations;
