import { ReactNode, FC } from "react";
import ContextWrapper from "./ContextWrapper";
import { unstable_cache } from "next/cache";
import { getOrganizationSettings } from "../lib/organization-settings-actions";
import GlobalConstants from "../GlobalConstants";
import { getLoggedInUser, getUserById } from "../lib/user-actions";

interface ServerContextWrapperProps {
    children: ReactNode;
}

const ServerContextWrapper: FC<ServerContextWrapperProps> = async ({ children }) => {
    const organizationSettingsPromise = unstable_cache(getOrganizationSettings, [], {
        tags: [GlobalConstants.ORGANIZATION_SETTINGS],
    })();

    // Get user info first to use as cache key
    const loggedInUser = await getLoggedInUser();
    // Use userId in cache key to ensure proper invalidation
    const loggedInUserPromise = unstable_cache(getUserById, [loggedInUser.id], {
        tags: [GlobalConstants.USER],
    })(loggedInUser.id);

    return (
        <ContextWrapper
            organizationSettingsPromise={organizationSettingsPromise}
            loggedInUserPromise={loggedInUserPromise}
        >
            {children}
        </ContextWrapper>
    );
};

export default ServerContextWrapper;
