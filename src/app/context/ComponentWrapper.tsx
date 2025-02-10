"use client";

import { ThemeProvider } from "@mui/material";
import React, { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

interface ComponentWrapperProps {
  children: React.ReactNode;
}

const ComponentWrapper: React.FC<ComponentWrapperProps> = ({ children }) => {
  const themeContext = useContext(ThemeContext);

  if (!themeContext) {
    throw new Error("ComponentWrapper must be used within a ThemeContextProvider");
  }

  const { theme } = themeContext;

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default ComponentWrapper;