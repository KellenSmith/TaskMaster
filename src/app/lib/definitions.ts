import GlobalConstants from "../GlobalConstants";
import dayjs from "dayjs";
import { Prisma, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// Convention: "path"=`/${route}`

export const getRelativeUrl = (
    pathSegments: string[] = [],
    searchParams: { [key: string]: string } = {},
): string => {
    // Use a relative path so redirects preserve cookies and work the same
    // whether running locally, on a custom domain, or on Vercel.
    const pathname = `/${pathSegments.filter(Boolean).join("/")}`.replace(/\/+/g, "/");
    // Use the URL class to build search params safely. Use a dummy base so
    // URL can parse the pathname, then return the relative path + search.
    const url = new URL(pathname, "http://localhost");
    for (const [key, value] of Object.entries(searchParams)) {
        url.searchParams.set(key, value);
    }
    // url.search contains the leading '?' when non-empty
    return url.search ? `${url.pathname}${url.search}` : url.pathname;
};

export const getAbsoluteUrl = (
    pathSegments: string[] = [],
    searchParams: { [key: string]: string } = {},
): string => {
    const baseUrl = process.env.VERCEL_URL
        ? "https://" + process.env.VERCEL_URL
        : window?.location?.origin;
    if (!baseUrl) throw new Error("Base URL not found");

    return baseUrl + getRelativeUrl(pathSegments, searchParams);
};

export const routeToPath = (route: string) => `/${route}`;
export const pathToRoute = (path: string) => (path ? path.slice(1) : ""); // Remove leading "/"
export const serverRedirect = (
    pathSegments: string[],
    searchParams: { [key: string]: string } = {},
) => {
    redirect(getRelativeUrl(pathSegments, searchParams));
};
export const clientRedirect = (
    router: AppRouterInstance,
    pathSegments: string[],
    searchParams: { [key: string]: string } = {},
) => {
    router.push(getRelativeUrl(pathSegments, searchParams));
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
        GlobalConstants.LOCATIONS,
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

export const isUserAdmin = (user: Prisma.UserGetPayload<true> | null): boolean =>
    user?.role === UserRole.admin;

export const isUserHost = (
    user: Prisma.UserGetPayload<{ select: { id: true } }> | null,
    event: Prisma.EventGetPayload<true> | null,
): boolean => user && event && user?.id === event?.hostId;

export const snakeCaseToLabel = (snakeCase: string) =>
    snakeCase[0].toUpperCase() + snakeCase.slice(1).replace(/_/g, " ");
