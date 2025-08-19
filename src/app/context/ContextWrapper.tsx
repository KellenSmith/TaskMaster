import { ReactNode, FC } from "react";
import ThemeContextProvider from "./ThemeContext";
import UserContextProvider from "./UserContext";
import OrganizationSettingsProvider from "./OrganizationSettingsContext";
import NotificationContextProvider from "./NotificationContext";
import { unstable_cache } from "next/cache";
import { getOrganizationSettings } from "../lib/organization-settings-actions";
import GlobalConstants from "../GlobalConstants";
import { getLoggedInUser } from "../lib/user-actions";
import { ErrorBoundary } from "react-error-boundary";
import { Typography } from "@mui/material";

interface ContextWrapperProps {
    children: ReactNode;
}

const ContextWrapper: FC<ContextWrapperProps> = async ({ children }) => {
    const organizationSettingsPromise = unstable_cache(getOrganizationSettings, [], {
        tags: [GlobalConstants.ORGANIZATION_SETTINGS],
    })();
    const loggedInUserPromise = unstable_cache(getLoggedInUser, [], {
        tags: [GlobalConstants.USER],
    })();

    return (
        <ErrorBoundary fallback={<Typography color="primary">Failed to load context</Typography>}>
            <NotificationContextProvider>
                <OrganizationSettingsProvider
                    organizationSettingsPromise={organizationSettingsPromise}
                >
                    <ThemeContextProvider>
                        <UserContextProvider loggedInUserPromise={loggedInUserPromise}>
                            {children}
                        </UserContextProvider>
                    </ThemeContextProvider>
                </OrganizationSettingsProvider>
            </NotificationContextProvider>
        </ErrorBoundary>
    );
};

export default ContextWrapper;
