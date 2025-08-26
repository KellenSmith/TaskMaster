"use client";
import { ReactNode, FC } from "react";
import ThemeContextProvider from "./ThemeContext";
import UserContextProvider from "./UserContext";
import OrganizationSettingsProvider from "./OrganizationSettingsContext";
import NotificationContextProvider from "./NotificationContext";
import LocalizationContextProvider from "./LocalizationContext";
import { Prisma } from "@prisma/client";
import ErrorBoundarySuspense from "../ui/ErrorBoundarySuspense";
import { SessionProvider } from "next-auth/react";

interface ContextWrapperProps {
    children: ReactNode;
    organizationSettingsPromise: Promise<any>;
}

const ContextWrapper: FC<ContextWrapperProps> = ({ children, organizationSettingsPromise }) => {
    return (
        <ErrorBoundarySuspense errorMessage="Failed to load context">
            <LocalizationContextProvider>
                <ThemeContextProvider>
                    <NotificationContextProvider>
                        <OrganizationSettingsProvider
                            organizationSettingsPromise={organizationSettingsPromise}
                        >
                            <SessionProvider>
                                <UserContextProvider>{children}</UserContextProvider>
                            </SessionProvider>
                        </OrganizationSettingsProvider>
                    </NotificationContextProvider>
                </ThemeContextProvider>
            </LocalizationContextProvider>
        </ErrorBoundarySuspense>
    );
};

export default ContextWrapper;
