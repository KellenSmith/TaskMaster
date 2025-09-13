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
    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL
        : window?.location?.origin;
    if (!baseUrl) throw new Error("Base URL not found");

    return baseUrl + getRelativeUrl(pathSegments, searchParams);
};

export const pathToRoutes = (path: string) => (path ? path.split("/").slice(1) : []);
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

export const isMembershipExpired = (
    user: Prisma.UserGetPayload<{
        include: { user_membership: true };
    }>,
): boolean => {
    if (!user) return true;
    const membershipExpiresAt = user.user_membership?.expires_at;
    return !membershipExpiresAt || dayjs.utc().isAfter(dayjs.utc(membershipExpiresAt));
};

export const isUserAdmin = (
    user: Prisma.UserGetPayload<{ include: { user_membership: true } }>,
): boolean => user && user.role === UserRole.admin && !!user.user_membership;

export const isUserHost = (
    user: Prisma.UserGetPayload<{ select: { id: true } }>,
    event: Prisma.EventGetPayload<true> | null,
): boolean => user && event && user.id === event.host_id;
