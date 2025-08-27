"use server";

import { NextRequest, NextResponse } from "next/server";
import GlobalConstants from "./app/GlobalConstants";
import { getUrl, isUserAuthorized } from "./app/lib/definitions";
import { getLoggedInUser } from "./app/lib/user-actions";

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ["/((?!api|_next/static|_next/image|README.pdf|.*\\.png$|.*\\.ico$).*)"],
};

export default async function middleware(req: NextRequest) {
    const loggedInUser = await getLoggedInUser();

    if (!req?.nextUrl?.pathname) return NextResponse.next();

    if (isUserAuthorized(req.nextUrl.pathname, loggedInUser)) {
        return NextResponse.next();
    }

    // Redirect authenticated but unauthorized users to home
    if (loggedInUser) return NextResponse.redirect(getUrl([GlobalConstants.HOME]));

    // Redirect unauthorized unauthenticated users to login
    return NextResponse.redirect(getUrl([GlobalConstants.LOGIN]));
}
