import { Language } from "../../prisma/generated/enums";

/**
 * Strings shared by every surface that starts a membership renewal.
 */
const LanguageTranslations = {
    renewMembership: {
        [Language.english]: "Renew membership",
        [Language.swedish]: "Förnya medlemskap",
    },
    activateMembership: {
        [Language.english]: "Activate membership",
        [Language.swedish]: "Aktivera medlemskap",
    },
    failedStartRenewal: {
        [Language.english]: "Failed to start membership renewal",
        [Language.swedish]: "Kunde inte starta förnyelse av medlemskap",
    },
    chooseMembership: {
        [Language.english]: "Choose membership",
        [Language.swedish]: "Välj medlemskap",
    },
    chooseMembershipHint: {
        [Language.english]:
            "Your membership type can only change at renewal. Pick the one you want to continue with",
        [Language.swedish]:
            "Din typ av medlemskap kan bara ändras vid förnyelse. Välj den du vill fortsätta med",
    },
    currentMembership: {
        [Language.english]: "Current",
        [Language.swedish]: "Nuvarande",
    },
    durationDays: {
        [Language.english]: (days: number) => `${days} days`,
        [Language.swedish]: (days: number) => `${days} dagar`,
    },
    details: {
        [Language.english]: "Details",
        [Language.swedish]: "Detaljer",
    },
    confirm: {
        [Language.english]: "Confirm",
        [Language.swedish]: "Bekräfta",
    },
    notEligible: {
        [Language.english]: "You are not eligible to renew a membership",
        [Language.swedish]: "Du kan inte förnya ett medlemskap",
    },
    awaitingValidation: {
        [Language.english]:
            "Your membership application is awaiting validation by an admin before it can be activated",
        [Language.swedish]:
            "Din medlemsansökan väntar på godkännande av en administratör innan den kan aktiveras",
    },
    membershipChoiceRequired: {
        [Language.english]: "Several membership types are available. Please choose one",
        [Language.swedish]: "Flera typer av medlemskap finns tillgängliga. Välj en",
    },
    // Banner copy
    bannerExpiringSoon: {
        [Language.english]: (days: number, date: string) =>
            `Your membership expires in ${days} ${days === 1 ? "day" : "days"} (${date}). Renewing now adds a full period on top - you lose nothing by renewing early.`,
        [Language.swedish]: (days: number, date: string) =>
            `Ditt medlemskap går ut om ${days} ${days === 1 ? "dag" : "dagar"} (${date}). Förnyar du nu läggs en hel period på - du förlorar ingenting på att förnya tidigt.`,
    },
    bannerExpired: {
        [Language.english]: (date: string) =>
            `Your membership expired on ${date}. Renew to book events and use your tickets.`,
        [Language.swedish]: (date: string) =>
            `Ditt medlemskap gick ut ${date}. Förnya för att boka evenemang och använda dina biljetter.`,
    },
    bannerAwaitingPayment: {
        [Language.english]: "You're approved. Activate your membership to get started.",
        [Language.swedish]: "Du är godkänd. Aktivera ditt medlemskap för att komma igång.",
    },
    bannerAwaitingValidation: {
        [Language.english]:
            "Your application is being reviewed. We'll email you when it's approved.",
        [Language.swedish]: "Din ansökan granskas. Vi mejlar dig när den är godkänd.",
    },
    bannerMembershipRequired: {
        [Language.english]: "That page requires an active membership.",
        [Language.swedish]: "Den sidan kräver ett aktivt medlemskap.",
    },
    // Membership process stepper
    steps: {
        apply: {
            label: { [Language.english]: "Apply", [Language.swedish]: "Ansök" },
            hint: {
                [Language.english]: "Fill in the form",
                [Language.swedish]: "Fyll i formuläret",
            },
        },
        review: {
            label: { [Language.english]: "We review", [Language.swedish]: "Vi granskar" },
            hint: {
                [Language.english]: "A person checks your application",
                [Language.swedish]: "En person granskar din ansökan",
            },
        },
        pay: {
            payLabel: { [Language.english]: "Pay", [Language.swedish]: "Betala" },
            activateLabel: { [Language.english]: "Activate", [Language.swedish]: "Aktivera" },
            hintFree: {
                [Language.english]: "Activating your membership is free",
                [Language.swedish]: "Det är gratis att aktivera ditt medlemskap",
            },
            hintSingle: {
                [Language.english]: (price: number, days: number) =>
                    `${price} SEK for ${days} days`,
                [Language.swedish]: (price: number, days: number) =>
                    `${price} SEK för ${days} dagar`,
            },
            hintChoice: {
                [Language.english]: (options: string[]) => `Choose between ${options.join(", ")}`,
                [Language.swedish]: (options: string[]) => `Välj mellan ${options.join(", ")}`,
            },
            hintUnknown: {
                [Language.english]: "We invite you to activate your membership",
                [Language.swedish]: "Vi bjuder in dig att aktivera ditt medlemskap",
            },
            free: { [Language.english]: "free", [Language.swedish]: "gratis" },
        },
        active: {
            label: { [Language.english]: "You're in", [Language.swedish]: "Du är med" },
            hint: {
                [Language.english]: "Book events and volunteer",
                [Language.swedish]: "Boka evenemang och engagera dig",
            },
        },
    },
    viewStatus: {
        [Language.english]: "View status",
        [Language.swedish]: "Visa status",
    },
    dismiss: {
        [Language.english]: "Dismiss",
        [Language.swedish]: "Stäng",
    },
};

export default LanguageTranslations;
