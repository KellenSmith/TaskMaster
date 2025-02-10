"use client";

import { createTheme, Theme } from "@mui/material";
import { createContext, useMemo } from "react";

interface ThemeContextProps {
    theme: Theme;
  }
  
export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeContextProviderProps {
    children: React.ReactNode;
}

const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
    const theme = useMemo(() => createTheme({
        palette: {
            mode: "dark"
        },
    }), []);

    return (
        <ThemeContext.Provider value={{ theme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export default ThemeContextProvider