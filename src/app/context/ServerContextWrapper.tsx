import { ReactNode, FC } from "react";
import ContextWrapper from "./ContextWrapper";
import { getOrganizationSettings } from "../lib/organization-settings-helpers";
import { getLoggedInUser } from "../lib/user-helpers";
import { prisma } from "../../prisma/prisma-client";
import { userHasRolePrivileges } from "../lib/auth/auth-utils";
import { UserRole } from "../../prisma/generated/enums";
import { Prisma } from "../../prisma/generated/browser";
import { isSwedbankPayConfigured } from "../lib/payment-helpers";

interface ServerContextWrapperProps {
    children: ReactNode;
}

const getAllowedInfoPagesByRoles = async (allowedUserRolePrivileges: UserRole[]) => {
    // Pages with no role restrictions are always allowed
    const lowestAllowedUserRoleCondition: Prisma.InfoPageWhereInput & {
        OR: Prisma.InfoPageWhereInput[];
    } = { OR: [{ lowest_allowed_user_role: { equals: null } }] };
    if (allowedUserRolePrivileges.length > 0) {
        lowestAllowedUserRoleCondition.OR.push({
            lowest_allowed_user_role: { in: allowedUserRolePrivileges },
        });
    }
    const allowedInfoPages = await prisma.infoPage.findMany({
        where: lowestAllowedUserRoleCondition,
        include: { titleText: { include: { translations: true } } },
    });

    return allowedInfoPages;
};

const getAllowedInfoPages = async () => {
    let loggedInUser = await getLoggedInUser();

    const allowedUserRolePrivileges = Object.values(UserRole)
        .filter((role) => userHasRolePrivileges(loggedInUser, role))
        .sort() as UserRole[];

    return getAllowedInfoPagesByRoles(allowedUserRolePrivileges);
};

const ServerContextWrapper: FC<ServerContextWrapperProps> = async ({ children }) => {
    const userPromise = getLoggedInUser();
    const organizationSettingsPromise = getOrganizationSettings();
    const infoPagesPromise = getAllowedInfoPages();
    const handlePaymentsManually = !isSwedbankPayConfigured();

    return (
        <ContextWrapper
            organizationSettingsPromise={organizationSettingsPromise}
            userPromise={userPromise}
            infoPagesPromise={infoPagesPromise}
            handlePaymentsManually={handlePaymentsManually}
        >
            {children}
        </ContextWrapper>
    );
};

export default ServerContextWrapper;
