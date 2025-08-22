import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { Event, Prisma, User, UserRole } from "@prisma/client";

// Convention: "path"=`/${route}`

export const routes = {
    [GlobalConstants.ADMIN]: [
        GlobalConstants.SENDOUT,
        GlobalConstants.MEMBERS,
        GlobalConstants.PRODUCTS,
        GlobalConstants.ORDERS,
        GlobalConstants.ORGANIZATION_SETTINGS,
    ],
    [GlobalConstants.PRIVATE]: [GlobalConstants.PROFILE, GlobalConstants.CALENDAR],
    [GlobalConstants.PUBLIC]: [
        GlobalConstants.HOME,
        GlobalConstants.LOGIN,
        GlobalConstants.RESET,
        GlobalConstants.APPLY,
        GlobalConstants.CONTACT,
        GlobalConstants.ORDER,
    ],
};

export const routesToPath = (routeList: string[]) => routeList.map((route) => `/${route}`);

export const isUserAuthorized = (
    path: string,
    user: Prisma.UserGetPayload<{
        include: { userMembership: true };
    }> | null,
): boolean => {
    // Only allow non-logged in users access to public routes
    if (!user) return routesToPath(routes[GlobalConstants.PUBLIC]).includes(path);
    // Only allow users with expired memberships access to public pages and their own profile
    if (isMembershipExpired(user))
        return routesToPath([...routes[GlobalConstants.PUBLIC], GlobalConstants.PROFILE]).includes(
            path,
        );

    // Allow admins access to all routes
    if (user.role === UserRole.admin) return true;
    // Allow regular users access to everything except admin paths.
    const adminPaths = routesToPath(routes[GlobalConstants.ADMIN]);
    return !adminPaths.some((adminPath) => path.startsWith(adminPath));
};

export const isMembershipExpired = (
    user: Prisma.UserGetPayload<{
        include: { userMembership: true };
    }> | null,
): boolean => {
    const membershipExpiresAt = user?.userMembership?.expiresAt;
    return !membershipExpiresAt || dayjs().isAfter(dayjs(membershipExpiresAt));
};

export const isUserAdmin = (
    user: Prisma.UserGetPayload<{
        include: { userMembership: true };
    }> | null,
): boolean => user && user.role === UserRole.admin;

export const isUserHost = (
    user: Prisma.UserGetPayload<{ select: { id: true } }> | null,
    event: Event,
): boolean => user && user.id === event.hostId;

export interface FormActionState {
    status: number;
    errorMsg: string;
    result: string;
}

export const defaultFormActionState: FormActionState = {
    status: 200,
    errorMsg: "",
    result: "",
};

export interface DatagridActionState {
    status: number;
    errorMsg: string;
    result: any[];
}

export const defaultDatagridActionState: DatagridActionState = {
    status: 200,
    errorMsg: "",
    result: [],
};
