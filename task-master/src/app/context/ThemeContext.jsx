"use client";

import { createTheme } from "@mui/material";
import { createContext } from "react";

export const ThemeContext = createContext();

const theme = createTheme({
    palette: {
        mode: "dark"
    },
});

export default function ThemeContextProvider({ children }) {

    return (
        <ThemeContext.Provider value={{ theme }}>
            {children}
        </ThemeContext.Provider>
    );
}