"use client";
import { ReactNode, FC, Suspense } from "react";
import ThemeContextProvider from "./ThemeContext";
import UserContextProvider from "./UserContext";
import OrganizationSettingsProvider from "./OrganizationSettingsContext";
import NotificationContextProvider from "./NotificationContext";
import LocalizationContextProvider from "./LocalizationContext";
import { ErrorBoundary } from "react-error-boundary";
import { CircularProgress, Typography } from "@mui/material";
import { Prisma } from "@prisma/client";

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
        <ErrorBoundary fallback={<Typography color="primary">Failed to load context</Typography>}>
            <Suspense fallback={<CircularProgress />}>
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
            </Suspense>
        </ErrorBoundary>
    );
};

export default ContextWrapper;
