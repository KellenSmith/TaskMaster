"use client";

import { createTheme, Theme, ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { blueGrey } from "@mui/material/colors";
import { createContext, useState, useEffect, ReactNode, FC } from "react";

interface ThemeContextProps {
    theme: Theme;
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeContextProviderProps {
    children: ReactNode;
}

const ThemeContextProvider: FC<ThemeContextProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<Theme | null>(null);

    useEffect(() => {
        const newTheme = createTheme({
            palette: {
                mode: "dark",
                primary: {
                    main: blueGrey["600"],
                },
            },
        });
        setTheme(newTheme);
    }, []);

    if (!theme) {
        return null; // Render nothing until the theme is set
    }

    return (
        <ThemeContext.Provider value={{ theme }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeContextProvider;
