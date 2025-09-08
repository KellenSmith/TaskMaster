import { Language } from "@prisma/client";

const LanguageTranslations = {
    login: {
        [Language.swedish]: "Logga in",
        [Language.english]: "Login",
    },
    logout: {
        [Language.swedish]: "Logga ut",
        [Language.english]: "Logout",
    },
    loggingIn: {
        [Language.swedish]: "En inloggningslänk skickas till din e-post inom kort",
        [Language.english]: "A sign-in link will be sent to your email shortly",
    },
    failedLogin: {
        [Language.swedish]: "Ansök om medlemskap",
        [Language.english]: "Apply for membership",
    },
    applyForMembership: {
        [Language.swedish]: "Ansök om medlemskap",
        [Language.english]: "Apply for Membership",
    },
};

export default LanguageTranslations;
