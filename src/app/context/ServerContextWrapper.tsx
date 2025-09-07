import { ReactNode, FC } from "react";
import ContextWrapper from "./ContextWrapper";
import { unstable_cache } from "next/cache";
import { getOrganizationSettings } from "../lib/organization-settings-actions";
import GlobalConstants from "../GlobalConstants";
import { getUserById } from "../lib/user-actions";
import { auth } from "../lib/auth/auth";

interface ServerContextWrapperProps {
    children: ReactNode;
}

const ServerContextWrapper: FC<ServerContextWrapperProps> = async ({ children }) => {
    const organizationSettingsPromise = unstable_cache(getOrganizationSettings, [], {
        tags: [GlobalConstants.ORGANIZATION_SETTINGS],
    })();

    // Get the auth session first (outside of any caching)
    const session = await auth();
    const userId = session?.user?.id;

    // Only cache the user data fetching if we have a user ID
    const userPromise = userId
        ? unstable_cache(getUserById, [userId], {
              tags: [GlobalConstants.USER],
          })(userId)
        : Promise.resolve(null);

    return (
        <ContextWrapper
            organizationSettingsPromise={organizationSettingsPromise}
            userPromise={userPromise}
        >
            {children}
        </ContextWrapper>
    );
};

export default ServerContextWrapper;
