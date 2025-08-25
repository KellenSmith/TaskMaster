import { ReactNode, FC } from "react";
import ContextWrapper from "./ContextWrapper";
import { unstable_cache } from "next/cache";
import { getOrganizationSettings } from "../lib/organization-settings-actions";
import GlobalConstants from "../GlobalConstants";
import { getLoggedInUser } from "../lib/user-actions";
import { isUserAuthorized, pathToRoute, serverRedirect } from "../lib/definitions";

interface ServerContextWrapperProps {
    children: ReactNode;
    pathname?: string;
}

const ServerContextWrapper: FC<ServerContextWrapperProps> = async ({ children, pathname }) => {
    const organizationSettingsPromise = unstable_cache(getOrganizationSettings, [], {
        tags: [GlobalConstants.ORGANIZATION_SETTINGS],
    })();

    const requestedRoute = pathToRoute(pathname);
    const loggedInUser = await getLoggedInUser();

    //  Redirect authenticated users from login to home
    if (loggedInUser && requestedRoute === GlobalConstants.LOGIN)
        serverRedirect([GlobalConstants.HOME]);

    if (!isUserAuthorized(requestedRoute, loggedInUser)) {
        if (loggedInUser) {
            // Redirect logged in users to home
            return serverRedirect([GlobalConstants.HOME]);
        } else {
            // Redirect guests to login
            return serverRedirect([GlobalConstants.LOGIN]);
        }
    }

    return (
        <ContextWrapper
            organizationSettingsPromise={organizationSettingsPromise}
            loggedInUser={loggedInUser}
        >
            {children}
        </ContextWrapper>
    );
};

export default ServerContextWrapper;
