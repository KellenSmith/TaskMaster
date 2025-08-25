"use client";
import { ReactNode, FC } from "react";
import ThemeContextProvider from "./ThemeContext";
import UserContextProvider from "./UserContext";
import OrganizationSettingsProvider from "./OrganizationSettingsContext";
import NotificationContextProvider from "./NotificationContext";
import LocalizationContextProvider from "./LocalizationContext";
import { Prisma } from "@prisma/client";
import ErrorBoundarySuspense from "../ui/ErrorBoundarySuspense";

interface ContextWrapperProps {
    children: ReactNode;
    organizationSettingsPromise: Promise<any>;
    loggedInUser: Prisma.UserGetPayload<{ include: { userMembership: true } }>;
}

const ContextWrapper: FC<ContextWrapperProps> = ({
    children,
    organizationSettingsPromise,
    loggedInUser,
}) => {
    return (
        <ErrorBoundarySuspense errorMessage="Failed to load context">
            <LocalizationContextProvider>
                <ThemeContextProvider>
                    <NotificationContextProvider>
                        <OrganizationSettingsProvider
                            organizationSettingsPromise={organizationSettingsPromise}
                        >
                            <UserContextProvider loggedInUser={loggedInUser}>
                                {children}
                            </UserContextProvider>
                        </OrganizationSettingsProvider>
                    </NotificationContextProvider>
                </ThemeContextProvider>
            </LocalizationContextProvider>
        </ErrorBoundarySuspense>
    );
};

export default ContextWrapper;
