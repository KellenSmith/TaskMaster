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
        [Language.swedish]: "Loggade in. Omdirigerar...",
        [Language.english]: "Logged in. Redirecting...",
    },
    resetPassword: {
        [Language.swedish]: "Återställ lösenord",
        [Language.english]: "Reset Password",
    },
    applyForMembership: {
        [Language.swedish]: "Ansök om medlemskap",
        [Language.english]: "Apply for Membership",
    },
};

export default LanguageTranslations;
