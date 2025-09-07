"use client";
import { ReactNode, FC } from "react";
import ThemeContextProvider from "./ThemeContext";
import UserContextProvider from "./UserContext";
import OrganizationSettingsProvider from "./OrganizationSettingsContext";
import NotificationContextProvider from "./NotificationContext";
import LocalizationContextProvider from "./LocalizationContext";
import ErrorBoundarySuspense from "../ui/ErrorBoundarySuspense";
import { SessionProvider } from "next-auth/react";
import { Prisma } from "@prisma/client";

interface ContextWrapperProps {
    children: ReactNode;
    organizationSettingsPromise: Promise<Prisma.OrganizationSettingsGetPayload<true> | null>;
    userPromise: Promise<Prisma.UserGetPayload<{
        include: { user_membership: true; skill_badges: true };
    }> | null>;
}

const ContextWrapper: FC<ContextWrapperProps> = ({
    children,
    organizationSettingsPromise,
    userPromise,
}) => {
    return (
        <ErrorBoundarySuspense>
            <LocalizationContextProvider>
                <ThemeContextProvider>
                    <NotificationContextProvider>
                        <OrganizationSettingsProvider
                            organizationSettingsPromise={organizationSettingsPromise}
                        >
                            <SessionProvider>
                                <UserContextProvider userPromise={userPromise}>
                                    {children}
                                </UserContextProvider>
                            </SessionProvider>
                        </OrganizationSettingsProvider>
                    </NotificationContextProvider>
                </ThemeContextProvider>
            </LocalizationContextProvider>
        </ErrorBoundarySuspense>
    );
};

export default ContextWrapper;
