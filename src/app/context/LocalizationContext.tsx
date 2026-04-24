"use client";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "../lib/dayjs";
import { ReactNode, FC } from "react";

const locale = "sv";

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
