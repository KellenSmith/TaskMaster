"use server";

import { NextRequest, NextResponse } from "next/server";
import GlobalConstants from "./app/GlobalConstants";
import { getAbsoluteUrl, pathToRoutes } from "./app/lib/definitions";
import NextAuth from "next-auth";
import { isUserAuthorized, routeTreeConfig } from "./app/lib/auth/auth-utils";
import "./app/lib/auth/auth-types";

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: [
        "/((?!api|_next/static|_next/image|.well-known,appspecific,com.chrome.devtools.json|appspecific,com.chrome.devtools.json|README.pdf|.*\\.png$|.*\\.ico$|.*\\.svg$).*)",
    ],
};

export default async function middleware(req: NextRequest) {
    // Initialize NextAuth with empty providers to access the auth function
    // in edge runtime without node-specific nodemailer provider and prisma adapter
    const { auth } = NextAuth({ providers: [] });
    const loggedInUser = (await auth())?.user;

    if (!req?.nextUrl?.pathname) return NextResponse.next();

    if (isUserAuthorized(loggedInUser, pathToRoutes(req.nextUrl.pathname), routeTreeConfig)) {
        return NextResponse.next();
    }

    // Redirect authenticated but unauthorized users to home
    if (loggedInUser) return NextResponse.redirect(getAbsoluteUrl([GlobalConstants.HOME]));

    // Redirect unauthorized unauthenticated users to login
    return NextResponse.redirect(getAbsoluteUrl([GlobalConstants.LOGIN]));
}
