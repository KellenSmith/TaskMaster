"use client";

import ThemeContextProvider from "./ThemeContext";
import ComponentWrapper from "./ComponentWrapper";

interface ContextProvidersProps {
    children: React.ReactNode;
}

const ContextProviders: React.FC<ContextProvidersProps> = ({ children }) => {
    return (
        <ThemeContextProvider>
            <ComponentWrapper>{children}</ComponentWrapper>
        </ThemeContextProvider>
    );
}

export default ContextProviders;