"use client";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import "dayjs/locale/en-gb";
import updateLocale from "dayjs/plugin/updateLocale";
import { ReactNode, FC } from "react";

const locale = "en-gb";

dayjs.extend(isoWeek);
dayjs.extend(updateLocale);
dayjs.locale(locale);

dayjs.updateLocale(locale, {
    weekStart: 1,
    weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    weekdaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
});

interface LocalizationContextProviderProps {
    children: ReactNode;
}

const LocalizationContextProvider: FC<LocalizationContextProviderProps> = ({ children }) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>
            {children}
        </LocalizationProvider>
    );
};

export default LocalizationContextProvider;
