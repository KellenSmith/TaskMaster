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

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
    return (
        <html lang="en">
            <body style={{ height: "100vh", backgroundColor: "#121212" }}>
                <ServerContextWrapper>
                    <NavPanel />
                    <Stack sx={{ height: "100%" }} padding={4}>
                        {children}
                    </Stack>
                </ServerContextWrapper>
            </body>
        </html>
    );
};

export default RootLayout;
