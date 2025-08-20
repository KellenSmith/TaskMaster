import { ReactNode, FC } from "react";
import ContextWrapper from "./ContextWrapper";
import { unstable_cache } from "next/cache";
import { getOrganizationSettings } from "../lib/organization-settings-actions";
import GlobalConstants from "../GlobalConstants";
import { getLoggedInUser, getUserById } from "../lib/user-actions";
import { deleteUserCookieAndRedirectToHome } from "../lib/auth/auth";

interface ServerContextWrapperProps {
    children: ReactNode;
}

const ServerContextWrapper: FC<ServerContextWrapperProps> = async ({ children }) => {
    const organizationSettingsPromise = unstable_cache(getOrganizationSettings, [], {
        tags: [GlobalConstants.ORGANIZATION_SETTINGS],
    })();

    // Get user info first to use as cache key
    let loggedInUser = null;
    try {
        loggedInUser = await getLoggedInUser();
    } catch {
        await deleteUserCookieAndRedirectToHome();
    }

    // Allow no user to be logged in to the context
    const getLoggedInUserOrNull = async (loggedInUserId: string) => {
        try {
            return await getUserById(loggedInUserId);
        } catch {
            return null;
        }
    };
    // Use userId in cache key to ensure proper invalidation
    const loggedInUserPromise = unstable_cache(getLoggedInUserOrNull, [loggedInUser?.id], {
        tags: [GlobalConstants.USER],
    })(loggedInUser?.id);

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
