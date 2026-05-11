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
export const timezoneName = "UTC";
export const organizationInputTimezone = process.env.NEXT_PUBLIC_ORG_TIMEZONE || "Europe/Stockholm";
export const dateTimeInputFormat = "YYYY-MM-DD HH:mm";

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

export const isValidOrganizationDateTimeInput = (value: string): boolean =>
    dayjs(value, dateTimeInputFormat, true).isValid();

export const parseOrganizationDateTimeInputToUTC = (value: string): string =>
    dayjs.tz(value, dateTimeInputFormat, organizationInputTimezone).utc().format();

export const formatUTCForBrowserLocalDisplay = (
    value: string | Date | dayjs.Dayjs,
    format = "YYYY/MM/DD HH:mm",
): string => dayjs.utc(value).local().format(format);

export const convertUTCToLocalDayjs = (value: string | Date | dayjs.Dayjs): dayjs.Dayjs =>
    dayjs.utc(value).local();

export const formatDateTimeForSubmission = (
    value: dayjs.Dayjs,
    format = dateTimeInputFormat,
): string => value.format(format);

export type { Dayjs } from "dayjs";
export default dayjs.utc;
