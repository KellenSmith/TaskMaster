import { ReactNode, FC } from "react";
import ContextWrapper from "./ContextWrapper";
import { getOrganizationSettings } from "../lib/organization-settings-actions";
import { getLoggedInUser } from "../lib/user-actions";
import { prisma } from "../../prisma/prisma-client";
import { userHasRolePrivileges } from "../lib/auth/auth-utils";
import { UserRole } from "../../prisma/generated/enums";
import { Prisma } from "../../prisma/generated/browser";

interface ServerContextWrapperProps {
    children: ReactNode;
}

const ServerContextWrapper: FC<ServerContextWrapperProps> = async ({ children }) => {
    const loggedInUser = await getLoggedInUser();

    const allowedUserRolePrivileges = Object.values(UserRole).filter((role) =>
        userHasRolePrivileges(loggedInUser, role),
    ) as UserRole[];

    // Pages with no role restrictions are always allowed
    const lowestAllowedUserRoleCondition: Prisma.InfoPageWhereInput & {
        OR: Prisma.InfoPageWhereInput[];
    } = { OR: [{ lowest_allowed_user_role: { equals: null } }] };
    if (allowedUserRolePrivileges.length > 0) {
        lowestAllowedUserRoleCondition.OR.push({
            lowest_allowed_user_role: { in: allowedUserRolePrivileges },
        });
    }
    const infoPagesPromise = prisma.infoPage.findMany({
        where: lowestAllowedUserRoleCondition,
        include: { titleText: { include: { translations: true } } },
    });

    const organizationSettingsPromise = getOrganizationSettings();

    return (
        <ContextWrapper
            organizationSettingsPromise={organizationSettingsPromise}
            userPromise={new Promise((resolve) => resolve(loggedInUser))}
            infoPagesPromise={infoPagesPromise}
        >
            {children}
        </ContextWrapper>
    );
};

export default ServerContextWrapper;
