"use server";

import { NextRequest, NextResponse } from "next/server";
import GlobalConstants from "./app/GlobalConstants";
import { getAbsoluteUrl, pathToRoutes } from "./app/lib/utils";
import NextAuth from "next-auth";
import { isUserAuthorized, routeTreeConfig } from "./app/lib/auth/auth-utils";
import { triggerNewsletterProcessing } from "./app/lib/newsletter-trigger";
import "./app/lib/auth/auth-types";

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: [
        "/((?!api|_next/static|_next/image|.well-known,appspecific,com.chrome.devtools.json|appspecific,com.chrome.devtools.json|README.pdf|.*\\.png$|.*\\.ico$|.*\\.svg$).*)",
    ],
};

export default async function middleware(req: NextRequest) {
    // Skip middleware for Next.js Server Actions and related special POSTs
    // Next adds special headers like Next-Action/RSC and often uses text/plain bodies
    // Be generous so we never block/redirect action requests by mistake.
    if (req.method === "POST") {
        const headers = req.headers;
        const contentType = headers.get("content-type") || "";
        const isServerAction =
            headers.has("next-action") ||
            headers.has("Next-Action") ||
            headers.has("rsc") ||
            headers.has("RSC") ||
            // Server Actions frequently use text/plain payloads
            contentType.includes("text/plain") ||
            // Multipart forms should also bypass auth logic
            contentType.includes("multipart/form-data");

        const isInternalNext =
            req.url.includes("_next/static") || req.nextUrl.pathname.startsWith("/api/");

        if (isServerAction || isInternalNext) {
            return NextResponse.next();
        }
    }

    // Initialize NextAuth with empty providers to access the auth function
    // in edge runtime without node-specific nodemailer provider and prisma adapter
    const { auth } = NextAuth({ providers: [] });
    const loggedInUser = (await auth())?.user;

    if (!req?.nextUrl?.pathname) return NextResponse.next();

    // Create response based on authorization
    let response: NextResponse;

    if (isUserAuthorized(loggedInUser, pathToRoutes(req.nextUrl.pathname), routeTreeConfig)) {
        response = NextResponse.next();
    } else if (loggedInUser) {
        // Redirect authenticated but unauthorized users to home
        response = NextResponse.redirect(getAbsoluteUrl([GlobalConstants.HOME]));
    } else {
        // Redirect unauthorized unauthenticated users to login
        response = NextResponse.redirect(getAbsoluteUrl([GlobalConstants.LOGIN]));
    }

    // Add security headers
    addSecurityHeaders(response);

    // Trigger newsletter processing in background on user activity
    // This runs asynchronously and doesn't block the user request
    triggerNewsletterProcessing().catch(() => {
        // Silently handle errors - newsletter processing is not critical for user experience
    });

    return response;
}

function addSecurityHeaders(response: NextResponse) {
    // Only add HSTS in production with HTTPS
    if (process.env.NODE_ENV === "production") {
        response.headers.set(
            "Strict-Transport-Security",
            "max-age=63072000; includeSubDomains; preload",
        );
    }

    // Add additional security headers not covered by next.config.mjs
    response.headers.set("X-DNS-Prefetch-Control", "off");
    response.headers.set("X-Download-Options", "noopen");
    response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

    // Remove server information
    response.headers.delete("Server");
    response.headers.delete("X-Powered-By");
}
