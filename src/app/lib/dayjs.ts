import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import updateLocale from "dayjs/plugin/updateLocale";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/sv";
import isBetween from "dayjs/plugin/isBetween";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import localeData from "dayjs/plugin/localeData";

export const locale = process.env.NEXT_PUBLIC_LOCALE || "sv";
export const timezoneName = process.env.NEXT_PUBLIC_TIMEZONE || "Etc/GMT-1";

dayjs.extend(isoWeek);
dayjs.extend(updateLocale);
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale(locale);
dayjs.extend(localeData);
dayjs.extend(isBetween);

dayjs.updateLocale(locale, {
    weekStart: 1,
    weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    weekdaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
});
dayjs.tz.setDefault(timezoneName);

export const weekDaysShort = dayjs.weekdaysShort;

export type { Dayjs } from "dayjs";
export default dayjs.utc;
