import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { Prisma } from "@prisma/client";
import { JWTPayload } from "jose";

// Convention: "path"=`/${route}`

export const routes = {
    [GlobalConstants.ADMIN]: [
        GlobalConstants.SENDOUT,
        GlobalConstants.MEMBERS,
        GlobalConstants.PRODUCTS,
        GlobalConstants.ORDERS,
    ],
    [GlobalConstants.PRIVATE]: [GlobalConstants.PROFILE, GlobalConstants.CALENDAR],
    [GlobalConstants.PUBLIC]: [
        GlobalConstants.HOME,
        GlobalConstants.LOGIN,
        GlobalConstants.RESET,
        GlobalConstants.APPLY,
        GlobalConstants.CONTACT,
        GlobalConstants.ORDER,
        "order/complete",
    ],
};

export const routesToPath = (routeList: string[]) => routeList.map((route) => `/${route}`);

export const isUserAuthorized = (path: string, user: any): boolean => {
    // Only allow non-logged in users access to public routes
    if (!user) return routesToPath(routes[GlobalConstants.PUBLIC]).includes(path);
    // Only allow users with expired memberships access to public pages and their own profile
    if (isMembershipExpired(user))
        return routesToPath([...routes[GlobalConstants.PUBLIC], GlobalConstants.PROFILE]).includes(
            path,
        );

    // Allow admins access to all routes
    if (user[GlobalConstants.ROLE] === GlobalConstants.ADMIN) return true;
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
    return !membershipExpiresAt || dayjs(membershipExpiresAt).isBefore(dayjs());
};

export const isUserAdmin = (user: any): boolean =>
    user && user[GlobalConstants.ROLE] === GlobalConstants.ADMIN;

export const isUserHost = (user: any, event: any): boolean =>
    user && user[GlobalConstants.ID] === event[GlobalConstants.HOST_ID];

export interface LoginSchema {
    email: string;
    password: string;
}

export interface ResetCredentialsSchema {
    email: string;
}

export interface UpdateCredentialsSchema {
    currentPassword: string;
    newPassword: string;
    repeatPassword: string;
}

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
