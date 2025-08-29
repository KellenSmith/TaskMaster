import { Language } from "@prisma/client";
import dayjs from "dayjs";

const LanguageTranslations = {
    locationCapacityExceeded: {
        [Language.english]: "The location can't handle this many participants",
        [Language.swedish]: "Lokalen kan inte husera så många deltagare",
    },
    createEvent: {
        [Language.english]: "Create event",
        [Language.swedish]: "Skapa evenemang",
    },
    createEventDraft: {
        [Language.english]: "Create draft",
        [Language.swedish]: "Skapa utkast",
    },
    weekDaysShort: {
        [Language.english]: dayjs.weekdaysShort(),
        [Language.swedish]: ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"],
    },
};

export default LanguageTranslations;
