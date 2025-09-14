import React from "react";
import NavPanel from "./ui/NavPanel";
import { Stack } from "@mui/material";
import ServerContextWrapper from "./context/ServerContextWrapper";
import { generateSEOMetadata } from "./lib/seo-utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = generateSEOMetadata({
    title: undefined, // Will use base title from environment
    description: undefined, // Will use base description from environment
    keywords: [], // Will use base keywords from environment
});

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
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
};

export default RootLayout;
