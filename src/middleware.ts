"user server";

import { NextRequest, NextResponse } from "next/server";
import GlobalConstants from "./app/GlobalConstants";
import { decryptJWT } from "./app/lib/auth/auth";
import { NextURL } from "next/dist/server/web/next-url";
import { routes } from "./app/lib/definitions";
import { routeHasPrivacyStatus } from "./app/lib/utils";

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.ico$).*)"],
};

export default async function middleware(req: NextRequest) {
  const reqPath = req.nextUrl.pathname;
  const redirectUrl = new NextURL(req.nextUrl);
  redirectUrl.pathname = `/${GlobalConstants.LOGIN}`;
  const loggedInUser = await decryptJWT();

  for (let route of [
    `/${GlobalConstants.HOME}`,
    `/${GlobalConstants.LOGIN}`,
    `/${GlobalConstants.PROFILE}`,
    `/${GlobalConstants.MEMBERS}`,
    `/${GlobalConstants.MEMBERS}/${GlobalConstants.CREATE}`,
  ])
    console.log(
      route,
      ": ",
      GlobalConstants.PUBLIC,
      routeHasPrivacyStatus(route, GlobalConstants.PUBLIC),
      GlobalConstants.PRIVATE,
      routeHasPrivacyStatus(route, GlobalConstants.PRIVATE),
      GlobalConstants.ADMIN,
      routeHasPrivacyStatus(route, GlobalConstants.ADMIN)
    );

  // User not logged in
  if (!loggedInUser) {
    if (routeHasPrivacyStatus(reqPath, GlobalConstants.PUBLIC))
      return NextResponse.next();
    // Redirect to login from non-public pages if the user is not logged in
    return NextResponse.redirect(redirectUrl);
  }
  redirectUrl.pathname = "/";
  // Redirect logged in users from login to home
  if (reqPath === `/${GlobalConstants.LOGIN}`)
    return NextResponse.redirect(redirectUrl);

  // Redirect non-admins to home from admin pages or login
  if (routeHasPrivacyStatus(reqPath, GlobalConstants.ADMIN)) {
    const userIsAdmin =
      loggedInUser[GlobalConstants.ROLE] === GlobalConstants.ADMIN;
    if (!userIsAdmin) return NextResponse.redirect(redirectUrl);
  }
  // Allow logged in users to access all private routes
  return NextResponse.next();
}
