import { Prisma, UserRole, UserStatus } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";

export type RouteConfigType = {
    name: string;
    status: UserStatus | null;
    role: UserRole | null;
    membershipRequired?: boolean;
    children: RouteConfigType[];
};

export const routeTreeConfig: RouteConfigType = {
    name: GlobalConstants.HOME,
    status: null,
    role: null,
    children: [
        {
            name: GlobalConstants.LOGIN,
            status: null,
            role: null,
            children: [],
        },
        {
            name: GlobalConstants.APPLY,
            status: null,
            role: null,
            children: [],
        },
        {
            name: GlobalConstants.CONTACT,
            status: null,
            role: null,
            children: [],
        },
        {
            name: GlobalConstants.PROFILE,
            status: UserStatus.pending,
            role: UserRole.member,
            children: [],
        },
        {
            name: GlobalConstants.ORDER,
            status: UserStatus.validated,
            role: UserRole.member,
            membershipRequired: true,
            children: [],
        },

        {
            name: GlobalConstants.CALENDAR,
            status: UserStatus.validated,
            role: UserRole.member,
            membershipRequired: true,
            children: [],
        },
        {
            name: GlobalConstants.TASKS,
            status: UserStatus.validated,
            role: UserRole.member,
            membershipRequired: true,
            children: [],
        },
        {
            name: GlobalConstants.TASK,
            status: UserStatus.validated,
            role: UserRole.member,
            membershipRequired: true,
            children: [],
        },
        {
            name: GlobalConstants.LOCATIONS,
            status: UserStatus.validated,
            role: UserRole.admin,
            membershipRequired: true,
            children: [],
        },
        {
            name: GlobalConstants.SKILL_BADGES,
            status: UserStatus.validated,
            role: UserRole.admin,
            membershipRequired: true,
            children: [],
        },
        // {
        //     name: GlobalConstants.YEAR_WHEEL,
        //     status: UserStatus.validated,
        //     role: UserRole.admin,
        //     children: [],
        // },
        {
            name: GlobalConstants.SENDOUT,
            status: UserStatus.validated,
            role: UserRole.admin,
            membershipRequired: true,
            children: [],
        },
        {
            name: GlobalConstants.MEMBERS,
            status: UserStatus.validated,
            role: UserRole.admin,
            membershipRequired: true,
            children: [],
        },
        {
            name: GlobalConstants.PRODUCTS,
            status: UserStatus.validated,
            role: UserRole.admin,
            membershipRequired: true,
            children: [],
        },
        {
            name: GlobalConstants.ORDERS,
            status: UserStatus.validated,
            role: UserRole.admin,
            membershipRequired: true,
            children: [],
        },
        {
            name: GlobalConstants.ORGANIZATION_SETTINGS,
            status: UserStatus.validated,
            role: UserRole.admin,
            membershipRequired: true,
            children: [],
        },
    ],
};

const userHasRolePrivileges = (
    user: Prisma.UserGetPayload<{ select: { role: true } }>,
    authRole: UserRole,
) => {
    // If user is not logged in, only show routes with no role requirement
    if (!user?.role) return !authRole;
    // Privileges defined in order of increasing access in UserRole enum
    const indexofAuthRole = Object.values(UserRole).indexOf(authRole);
    const indexOfLoggedInUserRole = Object.values(UserRole).indexOf(user.role);
    // User has equal or higher role privilege
    return indexOfLoggedInUserRole >= indexofAuthRole;
};

const userHasStatusPrivileges = (
    user: Prisma.UserGetPayload<{ select: { status: true } }>,
    authStatus: UserStatus,
) => {
    // If user is not logged in, only show routes with no status requirement
    if (!user?.status) return !authStatus;
    // Privileges defined in order of increasing access in UserStatus enum
    const indexofAuthStatus = Object.values(UserStatus).indexOf(authStatus);
    const indexOfLoggedInUserStatus = Object.values(UserStatus).indexOf(user.status);
    // User has equal or higher status privilege
    return indexOfLoggedInUserStatus >= indexofAuthStatus;
};

export const isUserAuthorized = (
    loggedInUser: Prisma.UserGetPayload<{
        select: { role: true; status: true; user_membership: true };
    }>,
    pathSegments: string[],
    routeConfig: RouteConfigType,
) => {
    if (!routeConfig) {
        // Reached the end of the path, user is authorized
        if (pathSegments.length === 0) return true;
        throw new Error(`Route configuration for "${pathSegments}" not found`);
    }
    if (
        !userHasRolePrivileges(loggedInUser, routeConfig.role) ||
        !userHasStatusPrivileges(loggedInUser, routeConfig.status)
    )
        return false;
    // If route requires auth (role or status) but user has no membership, not authorized
    if (routeConfig.membershipRequired && !loggedInUser?.user_membership) return false;

    const followingPath = pathSegments.slice(1);
    const followingRouteConfig = routeConfig.children.find(
        (childRoute) => childRoute.name === followingPath[0],
    );
    return isUserAuthorized(loggedInUser, followingPath, followingRouteConfig);
};
