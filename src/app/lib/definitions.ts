import { JWTPayload } from "jose";
import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { OrgSettings } from "./org-settings";

// Convention: "path"=`/${route}`

export const routes = {
    [GlobalConstants.ADMIN]: [GlobalConstants.MEMBERS],
    [GlobalConstants.PRIVATE]: [GlobalConstants.PROFILE, GlobalConstants.CALENDAR],
    [GlobalConstants.PUBLIC]: [
        GlobalConstants.HOME,
        GlobalConstants.LOGIN,
        GlobalConstants.RESET,
        GlobalConstants.APPLY,
    ],
};

export const routesToPath = (routeList: string[]) => routeList.map((route) => `/${route}`);

export const isUserAuthorized = (path: string, user: JWTPayload | null): boolean => {
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

export const isMembershipExpired = (user: any): boolean => {
    if (!user || !user[GlobalConstants.MEMBERSHIP_RENEWED]) return true;
    const expiryDate = dayjs(user[GlobalConstants.MEMBERSHIP_RENEWED]).add(
        (OrgSettings[GlobalConstants.MEMBERSHIP_DURATION] as number) + 1,
        "d",
    );
    return dayjs().isAfter(expiryDate);
};

export const isUserAdmin = (user: any): boolean =>
    user[GlobalConstants.ROLE] === GlobalConstants.ADMIN;

export const isUserHost = (user: any, event: any): boolean =>
    user[GlobalConstants.ID] === event[GlobalConstants.HOST_ID];

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
