"user server";

import { NextRequest, NextResponse } from "next/server";
import GlobalConstants from "./app/GlobalConstants";
import { decryptJWT } from "./app/lib/auth/auth";
import { NextURL } from "next/dist/server/web/next-url";
import { routes } from "./app/lib/definitions";

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};

export default async function middleware(req: NextRequest) {
  const reqPath = req.nextUrl.pathname;
  const redirectUrl = new NextURL(req.nextUrl);
  redirectUrl.pathname = `/${GlobalConstants.LOGIN}`;
  const loggedInUser = await decryptJWT();

  // User not logged in
  if (!loggedInUser) {
    const routeIsPublic = routes[GlobalConstants.PUBLIC]
      .map((route) => `/${route}`)
      .includes(reqPath);
    if (routeIsPublic) return NextResponse.next();
    // Redirect to login from non-public pages if the user is not logged in
    return NextResponse.redirect(redirectUrl);
  }
  redirectUrl.pathname = "/";
  // Redirect logged in users from login to home
  if (reqPath === `/${GlobalConstants.LOGIN}`)
    return NextResponse.redirect(redirectUrl);

  // Redirect non-admins to home from admin pages or login
  const routeIsAdmin = routes[GlobalConstants.ADMIN]
    .map((route) => `/${route}`)
    .includes(reqPath);
  if (routeIsAdmin) {
    const userIsAdmin =
      loggedInUser[GlobalConstants.ROLE] === GlobalConstants.ADMIN;
    if (!userIsAdmin) return NextResponse.redirect(redirectUrl);
  }
  // Allow logged in users to access all private routes
  return NextResponse.next();
}
