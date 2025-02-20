import React from "react";
import ContextProviders from "./context";
import NavPanel from "./ui/NavPanel";

export const metadata = {
    title: "TaskMaster",
    description: "Your volunteer task management tool",
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
                    {children}
                </ContextProviders>
            </body>
        </html>
    );
};

export default RootLayout;
