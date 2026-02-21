import { Prisma, UserRole, UserStatus } from "@/prisma/generated/browser";
import GlobalConstants from "../../GlobalConstants";

export type RouteConfigType = {
    name: string;
    status: UserStatus | null;
    role: UserRole | null;
    membershipRequired?: boolean;
};

export const routeTreeConfig: RouteConfigType[] = [
    { name: GlobalConstants.HOME, status: null, role: null },
    {
        name: GlobalConstants.APPLY,
        status: null,
        role: null,
    },
    {
        name: GlobalConstants.LOGIN,
        status: null,
        role: null,
    },
    {
        name: GlobalConstants.CONTACT,
        status: null,
        role: null,
    },
    {
        name: GlobalConstants.PROFILE,
        status: UserStatus.pending,
        role: UserRole.member,
    },
    {
        name: GlobalConstants.EVENT,
        status: UserStatus.validated,
        role: UserRole.member,
        membershipRequired: true,
    },
    {
        name: GlobalConstants.CALENDAR,
        status: UserStatus.validated,
        role: UserRole.member,
        membershipRequired: true,
    },
    {
        name: GlobalConstants.TASK,
        status: UserStatus.validated,
        role: UserRole.member,
        membershipRequired: true,
    },
    {
        name: GlobalConstants.TASKS,
        status: UserStatus.validated,
        role: UserRole.member,
        membershipRequired: true,
    },
    {
        name: GlobalConstants.SHOP,
        status: UserStatus.validated,
        role: UserRole.member,
        membershipRequired: false,
    },
    {
        name: GlobalConstants.LOCATIONS,
        status: UserStatus.validated,
        role: UserRole.admin,
        membershipRequired: true,
    },
    {
        name: GlobalConstants.SKILL_BADGES,
        status: UserStatus.validated,
        role: UserRole.admin,
        membershipRequired: true,
    },
    {
        name: GlobalConstants.MEMBERS,
        status: UserStatus.validated,
        role: UserRole.admin,
        membershipRequired: true,
    },
    {
        name: GlobalConstants.VOLUNTEER_LEADERBOARD,
        status: UserStatus.validated,
        role: UserRole.admin,
        membershipRequired: true,
    },
    {
        name: GlobalConstants.ORDER,
        status: UserStatus.validated,
        role: UserRole.member,
        membershipRequired: true,
    },
    {
        name: GlobalConstants.ORDERS,
        status: UserStatus.validated,
        role: UserRole.admin,
        membershipRequired: true,
    },
    {
        name: GlobalConstants.PRODUCTS,
        status: UserStatus.validated,
        role: UserRole.admin,
        membershipRequired: true,
    },

    {
        name: GlobalConstants.SENDOUT,
        status: UserStatus.validated,
        role: UserRole.admin,
        membershipRequired: true,
    },

    {
        name: GlobalConstants.ORGANIZATION_SETTINGS,
        status: UserStatus.validated,
        role: UserRole.admin,
        membershipRequired: true,
    },
    // {
    //     name: GlobalConstants.YEAR_WHEEL,
    //     status: UserStatus.validated,
    //     role: UserRole.admin,
    // },
];

export const userHasRolePrivileges = (
    user: Prisma.UserGetPayload<{ select: { role: true } }> | null | undefined,
    authRole: UserRole | null | undefined,
) => {
    // Allow all users if no role is required
    if (!authRole) return true;
    // If user is not logged in, only show routes with no role requirement
    if (!user?.role) return !authRole;
    // Privileges defined in order of increasing access in UserRole enum
    const indexofAuthRole = Object.values(UserRole).indexOf(authRole);
    const indexOfLoggedInUserRole = Object.values(UserRole).indexOf(user.role);
    // User has equal or higher role privilege
    return indexOfLoggedInUserRole >= indexofAuthRole;
};

const userHasStatusPrivileges = (
    user: Prisma.UserGetPayload<{ select: { status: true } }> | null | undefined,
    authStatus: UserStatus | null | undefined,
) => {
    // Allow all users if no status is required
    if (!authStatus) return true;
    // If user is not logged in, only show routes with no status requirement
    if (!user?.status) return !authStatus;
    // Privileges defined in order of increasing access in UserStatus enum
    const indexofAuthStatus = Object.values(UserStatus).indexOf(authStatus);
    const indexOfLoggedInUserStatus = Object.values(UserStatus).indexOf(user.status);
    // User has equal or higher status privilege
    return indexOfLoggedInUserStatus >= indexofAuthStatus;
};

export const isUserAuthorized = (
    loggedInUser:
        | Prisma.UserGetPayload<{
              select: { role: true; status: true; user_membership: true };
          }>
        | null
        | undefined,
    pathname: string,
): boolean => {
    // Always allow access to root path - can be used for public landing page or redirect to login
    if (!pathname) return true;
    const parsedPathname = pathname.split("/")[pathname[0] === "/" ? 1 : 0]; // Only consider first segment after leading "/" for route config matching

    const routeConfig = routeTreeConfig.find((route) => route.name === parsedPathname);
    // Disallow access if route is not explicitly configured
    if (!routeConfig) return false;

    if (
        !userHasRolePrivileges(loggedInUser, routeConfig.role) ||
        !userHasStatusPrivileges(loggedInUser, routeConfig.status)
    )
        return false;
    // If route requires auth (role or status) but user has no membership, not authorized
    if (routeConfig.membershipRequired && !loggedInUser?.user_membership) return false;

    return true;
};
