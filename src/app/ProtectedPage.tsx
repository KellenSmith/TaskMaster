import { FC } from "react";
import GlobalConstants from "./GlobalConstants";
import {
    routeTreeConfig,
    userHasRolePrivileges,
    userHasStatusPrivileges,
} from "./lib/auth/auth-utils";
import { getLoggedInUser } from "./lib/user-helpers";
import { isMembershipExpired, serverRedirect } from "./lib/utils";

interface ProtectedPageProps {
    name: string;
    children: React.ReactNode;
}

const ProtectedPage: FC<ProtectedPageProps> = async ({ name, children }) => {
    const pageConfig = routeTreeConfig.find((route) => route.name === name);

    // Disallow access if route is not explicitly configured
    if (!pageConfig) {
        throw new Error(`Route configuration for ${name} not found in routeTreeConfig`);
    }

    // If no auth reqs, show page immediately
    if (!pageConfig.status && !pageConfig.role && !pageConfig.membershipRequired)
        return <>{children}</>;

    const loggedInUser = await getLoggedInUser();

    // If auth reqs and user is not logged in, go to login
    if (!loggedInUser) serverRedirect([GlobalConstants.LOGIN]);

    if (!userHasStatusPrivileges(loggedInUser, pageConfig.status)) {
        serverRedirect([GlobalConstants.PROFILE]);
        return null; // This line will never be reached, but is added to satisfy TypeScript's type checking
    }

    if (pageConfig.membershipRequired && isMembershipExpired(loggedInUser)) {
        serverRedirect([GlobalConstants.PROFILE]);
        return null; // This line will never be reached, but is added to satisfy TypeScript's type checking
    }

    if (pageConfig.role && !userHasRolePrivileges(loggedInUser, pageConfig.role)) {
        serverRedirect([GlobalConstants.PROFILE]);
        return null; // This line will never be reached, but is added to satisfy TypeScript's type checking
    }

    return <>{children}</>;
};

export default ProtectedPage;
