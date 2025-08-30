import { Language } from "@prisma/client";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";

// ensure localeData plugin is loaded before calling weekdaysShort()
dayjs.extend(localeData);

const LanguageTranslations = {
    locationCapacityExceeded: {
        [Language.english]: (locationCapacity: number) =>
            `The location can only handle ${locationCapacity} participants`,
        [Language.swedish]: (locationCapacity: number) =>
            `Lokalen kan bara ta in ${locationCapacity} deltagare`,
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
