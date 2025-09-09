import { ReactNode, FC } from "react";
import ContextWrapper from "./ContextWrapper";
import { unstable_cache } from "next/cache";
import { getOrganizationSettings } from "../lib/organization-settings-actions";
import GlobalConstants from "../GlobalConstants";
import { getLoggedInUser, getUserById } from "../lib/user-actions";
import { getInfoPages } from "../lib/info-page-actions";

interface ServerContextWrapperProps {
    children: ReactNode;
}

const ServerContextWrapper: FC<ServerContextWrapperProps> = async ({ children }) => {
    const organizationSettingsPromise = unstable_cache(getOrganizationSettings, [], {
        tags: [GlobalConstants.ORGANIZATION_SETTINGS],
    })();

    const loggedInUser = await getLoggedInUser();

    // Only cache the user data fetching if we have a user ID
    const userPromise = loggedInUser?.id
        ? unstable_cache(getUserById, [loggedInUser.id], {
              tags: [GlobalConstants.USER],
          })(loggedInUser.id)
        : Promise.resolve(null);

    const infoPagesPromise = unstable_cache(getInfoPages, [loggedInUser?.id], {
        tags: [GlobalConstants.INFO_PAGE],
    })(loggedInUser?.id);

    return (
        <ContextWrapper
            organizationSettingsPromise={organizationSettingsPromise}
            userPromise={userPromise}
            infoPagesPromise={infoPagesPromise}
        >
            {children}
        </ContextWrapper>
    );
};

export default ServerContextWrapper;
