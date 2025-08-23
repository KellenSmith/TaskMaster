"user server";

import { NextRequest, NextResponse } from "next/server";
import GlobalConstants from "./app/GlobalConstants";
import { isUserAuthorized, pathToRoute, routeToPath } from "./app/lib/definitions";
import { decryptJWT } from "./app/lib/auth";
import { Prisma } from "@prisma/client";
import { NextURL } from "next/dist/server/web/next-url";

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};

// Verify JWT token in middleware context
const getJwtPayload = async (
    req: NextRequest,
): Promise<Prisma.UserGetPayload<{
    include: { userMembership: true };
}> | null> => {
    try {
        // Access cookie directly from request
        const userCookie = req.cookies.get(GlobalConstants.USER).value;
        return await decryptJWT(userCookie);
    } catch {
        return null;
    }
};

export default async function middleware(req: NextRequest) {
    const loggedInUser = await getJwtPayload(req);

    // Check if user is authorized for the current path
    const isAuthorized = isUserAuthorized(req.nextUrl.pathname, loggedInUser);

    if (!loggedInUser) {
        // Unauthenticated users: allow access to authorized paths (public routes) only
        if (isAuthorized) {
            return NextResponse.next();
        }
        // Redirect unauthorized unauthenticated users to login
        return NextResponse.redirect(new URL(routeToPath(GlobalConstants.LOGIN), req.url));
    }

    // Authenticated users: only allow access to authorized paths
    if (isAuthorized) {
        return NextResponse.next();
    }

    // Redirect authenticated but unauthorized users to home
    return NextResponse.redirect(new URL(routeToPath(GlobalConstants.HOME), req.url));
}
