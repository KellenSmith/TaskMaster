import { weekDaysShort } from "../../lib/dayjs";
import { Language } from "../../../prisma/generated/enums";

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
        [Language.english]: weekDaysShort(),
        [Language.swedish]: ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"],
    },
    locationNotFound: {
        [Language.english]: "Selected location not found",
        [Language.swedish]: "Vald plats hittades inte",
    },
};

export default LanguageTranslations;
