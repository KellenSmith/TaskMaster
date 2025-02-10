"use client";

import { createTheme, Theme } from "@mui/material";
import { createContext, useState, useEffect } from "react";

interface ThemeContextProps {
  theme: Theme;
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeContextProviderProps {
  children: React.ReactNode;
}

const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const newTheme = createTheme({
      palette: {
        mode: "dark",
      },
    });
    setTheme(newTheme);
  }, []);

  if (!theme) {
    return null; // Render nothing until the theme is set
  }

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;