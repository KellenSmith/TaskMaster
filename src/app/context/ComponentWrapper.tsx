"use client";

import { ThemeProvider } from "@mui/material";
import React, { useContext } from "react";
import { ThemeContext } from "./ThemeContext";

interface ComponentWrapperProps {
    children: React.ReactNode;
}

const ComponentWrapper: React.FC<ComponentWrapperProps> = ({ children }) => {
    const { theme } = useContext(ThemeContext);
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

export default ComponentWrapper;