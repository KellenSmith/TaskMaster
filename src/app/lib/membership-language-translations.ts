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
};

export default LanguageTranslations;
