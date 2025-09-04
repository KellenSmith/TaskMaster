import { Language } from "@prisma/client";

const LanguageTranslations = {
    contactAssignee: {
        [Language.english]: "Contact assignee",
        [Language.swedish]: "Kontakta tilldelad medlem",
    },
    contactReviewer: {
        [Language.english]: "Contact reviewer",
        [Language.swedish]: "Kontakta granskare",
    },
    messagePrompt: {
        [Language.english]:
            "Send a message to the assignee or reviewer to ask questions or get involved!",
        [Language.swedish]:
            "Skicka ett meddelande till den tilldelade medlemmen eller granskaren för att ställa frågor eller hjälpa till!",
    },
    privacyWarning: {
        [Language.english]:
            "Please note that your email will be visible to the recipient of the message.",
        [Language.swedish]:
            "Observera att din mailadress kommer att vara synlig för mottagaren av meddelandet.",
    },
};

export default LanguageTranslations;
