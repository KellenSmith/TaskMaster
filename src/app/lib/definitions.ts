import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { Prisma, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { NextURL } from "next/dist/server/web/next-url";

// Convention: "path"=`/${route}`

export const getUrl = (
    pathSegments: string[] = [],
    searchParams: { [key: string]: string } = {},
): string => {
    const url = new NextURL(["/", ...pathSegments].join("/"));
    for (let [key, value] of Object.entries(searchParams)) {
        url.searchParams.set(key, value);
    }
    return url.toString();
};
export const routeToPath = (route: string) => `/${route}`;
export const pathToRoute = (path: string) => (path ? path.slice(1) : ""); // Remove leading "/"
export const serverRedirect = (
    pathSegments: string[],
    searchParams: { [key: string]: string } = {},
) => {
    const url = getUrl(pathSegments, searchParams);
    redirect(url.toString());
};

export const applicationRoutes = {
    [GlobalConstants.PUBLIC]: [
        GlobalConstants.HOME,
        GlobalConstants.LOGIN,
        GlobalConstants.RESET,
        GlobalConstants.APPLY,
        GlobalConstants.CONTACT,
        GlobalConstants.ORDER,
    ],
    [UserRole.member]: [GlobalConstants.PROFILE, GlobalConstants.CALENDAR],
    [UserRole.admin]: [
        GlobalConstants.TASKS,
        GlobalConstants.SENDOUT,
        GlobalConstants.MEMBERS,
        GlobalConstants.PRODUCTS,
        GlobalConstants.ORDERS,
        GlobalConstants.ORGANIZATION_SETTINGS,
    ],
};

export const isUserAuthorized = (
    pathname: string,
    user: Prisma.UserGetPayload<{
        include: { userMembership: true };
    }> | null,
): boolean => {
    const requestedRoute = pathToRoute(pathname);
    // Only allow non-logged in users access to public routes
    if (!user) return applicationRoutes[GlobalConstants.PUBLIC].includes(requestedRoute);
    // Only allow users with expired memberships access to public pages and their own profile
    if (isMembershipExpired(user))
        return [...applicationRoutes[GlobalConstants.PUBLIC], GlobalConstants.PROFILE].includes(
            requestedRoute,
        );
    // Allow admins access to all routes
    if (user.role === UserRole.admin) return true;
    // Allow regular users access to everything except admin paths.
    const adminRoutes = applicationRoutes[UserRole.admin];

    return !adminRoutes.some((adminRoute) => requestedRoute.startsWith(adminRoute));
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
): boolean => user?.role === UserRole.admin;

export const isUserHost = (
    user: Prisma.UserGetPayload<{ select: { id: true } }> | null,
    event: Prisma.EventGetPayload<true> | null,
): boolean => user && event && user?.id === event?.hostId;
