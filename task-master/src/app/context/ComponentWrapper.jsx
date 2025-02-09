"use client";

import { ThemeProvider } from "@mui/material";
import React, { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

export default function ComponentWrapper({ children }) {
    const { theme } = useContext(ThemeContext);
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}