import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import updateLocale from "dayjs/plugin/updateLocale";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/sv";

export const locale = process.env.NEXT_PUBLIC_LOCALE || "sv";

dayjs.extend(isoWeek);
dayjs.extend(updateLocale);
dayjs.extend(customParseFormat);
dayjs.locale(locale);

dayjs.updateLocale(locale, {
    weekStart: 1,
    weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    weekdaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
});

export type { Dayjs } from "dayjs";
export default dayjs;
