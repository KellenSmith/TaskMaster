import React from "react";
import NavPanel from "./ui/NavPanel";
import { Stack } from "@mui/material";
import ServerContextWrapper from "./context/ServerContextWrapper";

export const metadata = {
    title: process.env.NEXT_PUBLIC_ORG_NAME || "Task Master",
    description: process.env.NEXT_PUBLIC_ORG_DESCRIPTION || "Your volunteer management platform",
};

interface RootLayoutProps {
    children: React.ReactNode;
}

// The inner layout renders the app body contents without <html> / <body> wrappers.
// Exported for use in tests so we don't mount <html> inside the test container.
export const RootLayoutInner: React.FC<RootLayoutProps> = ({ children }) => {
    return (
        <ServerContextWrapper>
            <NavPanel />
            <Stack sx={{ height: "100%" }} padding={4}>
                {children}
            </Stack>
        </ServerContextWrapper>
    );
};

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
    return (
        <html lang="en">
            <body style={{ height: "100vh", backgroundColor: "#121212" }}>
                <RootLayoutInner>{children}</RootLayoutInner>
            </body>
        </html>
    );
};

export default RootLayout;
