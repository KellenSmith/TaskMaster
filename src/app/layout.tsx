import React from "react";
import ContextProviders from "./context";
import NavPanel from "./ui/NavPanel";
import { Stack } from "@mui/material";

export const metadata = {
    title: process.env.NEXT_PUBLIC_ORG_NAME,
    description: process.env.NEXT_PUBLIC_ORG_DESCRIPTION,
};

interface RootLayoutProps {
    children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
    return (
        <html lang="en">
            <body style={{ height: "100vh", backgroundColor: "#121212" }}>
                <ContextProviders>
                    <NavPanel />
                    <Stack sx={{ height: "100%" }} padding={4}>
                        {children}
                    </Stack>
                </ContextProviders>
            </body>
        </html>
    );
};

export default RootLayout;
