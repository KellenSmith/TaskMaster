import { Language } from "../../../prisma/generated/enums";

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
        [Language.swedish]:
            "Kund inte logga in. Om du inte redan är medlem kan du ansöka om medlemskap.",
        [Language.english]:
            "Failed to log in. If you are not already a member, you can apply for membership.",
    },
    applyForMembership: {
        [Language.swedish]: "Ansök om medlemskap",
        [Language.english]: "Apply for Membership",
    },
    logInWithAnotherDevice: {
        [Language.swedish]: "Länka en annan enhet",
        [Language.english]: "Link another device",
    },
    scanQrCodeInstruction: {
        [Language.swedish]:
            "Skanna denna QR-kod med en enhet där du redan är inloggad, eller ange koden nedan manuellt.",
        [Language.english]:
            "Scan this QR code with a device where you're already logged in, or enter the code below manually.",
    },
    orEnterCodeManually: {
        [Language.swedish]: "Eller ange en kod manuellt",
        [Language.english]: "Or enter a code manually",
    },
    orVisitApproveUrl: {
        [Language.swedish]: "Eller besök denna sida på din andra enhet och ange koden",
        [Language.english]: "Or visit this page on your other device and enter the code",
    },
    waitingForApproval: {
        [Language.swedish]: "Väntar på godkännande...",
        [Language.english]: "Waiting for approval...",
    },
    deviceWantsToLogIn: {
        [Language.swedish]: "En enhet vill logga in på ditt konto",
        [Language.english]: "A device wants to log in to your account",
    },
    approve: {
        [Language.swedish]: "Godkänn",
        [Language.english]: "Approve",
    },
    codeExpiredRegenerate: {
        [Language.swedish]: "Koden har gått ut. Skapa en ny kod.",
        [Language.english]: "This code has expired. Generate a new one.",
    },
    regenerateCode: {
        [Language.swedish]: "Skapa ny kod",
        [Language.english]: "Generate new code",
    },
    enterCodeFromOtherDevice: {
        [Language.swedish]: "Ange koden som visas på den andra enheten",
        [Language.english]: "Enter the code shown on the other device",
    },
    devicePairingApproved: {
        [Language.swedish]: "Enheten har godkänts. Loggar in...",
        [Language.english]: "Device approved. Logging in...",
    },
    continue: {
        [Language.swedish]: "Fortsätt",
        [Language.english]: "Continue",
    },
};

export default LanguageTranslations;
