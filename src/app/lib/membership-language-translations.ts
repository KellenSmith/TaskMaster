import { Language } from "../../prisma/generated/enums";

/**
 * Strings shared by every surface that starts a membership renewal.
 */
const LanguageTranslations = {
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
