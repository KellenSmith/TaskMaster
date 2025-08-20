"use client";
import { ReactNode, FC, Suspense } from "react";
import ThemeContextProvider from "./ThemeContext";
import UserContextProvider from "./UserContext";
import OrganizationSettingsProvider from "./OrganizationSettingsContext";
import NotificationContextProvider from "./NotificationContext";
import { ErrorBoundary } from "react-error-boundary";
import { CircularProgress, Typography } from "@mui/material";
import LocalizationContextProvider from "./LocalizationContext";

interface ContextWrapperProps {
    children: ReactNode;
    organizationSettingsPromise: Promise<any>;
    loggedInUserPromise: Promise<any>;
}

const ContextWrapper: FC<ContextWrapperProps> = ({
    children,
    organizationSettingsPromise,
    loggedInUserPromise,
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
                                <UserContextProvider loggedInUserPromise={loggedInUserPromise}>
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
