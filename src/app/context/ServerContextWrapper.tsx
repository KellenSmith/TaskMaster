import { ReactNode, FC } from "react";
import ContextWrapper from "./ContextWrapper";
import { getOrganizationSettings } from "../lib/organization-settings-actions";
import { getLoggedInUser } from "../lib/user-actions";
import { prisma } from "../../../prisma/prisma-client";
import { UserRole } from "@prisma/client";
import { userHasRolePrivileges } from "../lib/auth/auth-utils";

interface ServerContextWrapperProps {
    children: ReactNode;
}

const ServerContextWrapper: FC<ServerContextWrapperProps> = async ({ children }) => {
    const organizationSettingsPromise = getOrganizationSettings();

    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser)
        return await prisma.infoPage.findMany({
            where: {
                lowest_allowed_user_role: null,
            },
            include: { titleText: { include: { translations: true } } },
        });

    const allowedUserRolePrivileges = Object.values(UserRole).filter((role) =>
        userHasRolePrivileges(loggedInUser, role),
    ) as UserRole[];
    // All users are allowed to view pages with no role restrictions
    allowedUserRolePrivileges.push(null);

    const infoPages = await prisma.infoPage.findMany({
        where: {
            lowest_allowed_user_role: { in: allowedUserRolePrivileges }

        },
        include: { titleText: { include: { translations: true } } },
    });

    return (
        <ContextWrapper
            organizationSettingsPromise={organizationSettingsPromise}
            userPromise={new Promise((resolve) => resolve(loggedInUser))}
            infoPagesPromise={new Promise((resolve) => resolve(infoPages))}
        >
            {children}
        </ContextWrapper>
    );
};

export default ServerContextWrapper;
