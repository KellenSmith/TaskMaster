"user server";

import { NextRequest, NextResponse } from "next/server";
import GlobalConstants from "./app/GlobalConstants";
import { NextURL } from "next/dist/server/web/next-url";
import { isUserAuthorized } from "./app/lib/definitions";
import { decryptJWT } from "./app/lib/auth/auth";

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};

// Verify JWT token in middleware context
const getLoggedInUser = async (req: NextRequest) => {
    try {
        // Access cookie directly from request
        const userCookie = req.cookies.get(GlobalConstants.USER).value;
        return await decryptJWT(userCookie);
    } catch (error) {
        return null;
    }
};

export default async function middleware(req: NextRequest) {
    const reqPath = req.nextUrl.pathname;
    const redirectUrl = new NextURL(req.nextUrl);
    redirectUrl.pathname = `/${GlobalConstants.HOME}`;
    redirectUrl.search = new URLSearchParams().toString();
    const loggedInUser = await getLoggedInUser(req);

    if (
        // Redirect unauthorized users to home
        !isUserAuthorized(reqPath, loggedInUser) ||
        // Redirect logged in users from login to home
        (loggedInUser && reqPath === `/${GlobalConstants.LOGIN}`)
    )
        return NextResponse.redirect(redirectUrl);

    return NextResponse.next();
}
