"use client";

import { ThemeProvider } from "@mui/material";
import React, { useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import UserContextProvider from "./UserContext";

interface ComponentWrapperProps {
  children: React.ReactNode;
}

const ComponentWrapper: React.FC<ComponentWrapperProps> = ({ children }) => {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    throw new Error("ComponentWrapper must be used within a ThemeContextProvider");
  }

  const { theme } = themeContext;

  return <ThemeProvider theme={theme}>
    <UserContextProvider>
      {children}
    </UserContextProvider>
  </ThemeProvider>;
};

export default ComponentWrapper;