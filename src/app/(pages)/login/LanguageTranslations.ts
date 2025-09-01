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
    failedLogin: {
        [Language.swedish]:
            "Inloggning misslyckades. Om du har ansökt om medlemskap behöver du vänta på godkännande.",
        [Language.english]:
            "Login failed. If you have applied for membership, you need to wait for approval.",
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
