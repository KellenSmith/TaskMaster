"user server";

import { NextRequest, NextResponse } from "next/server";
import GlobalConstants from "./app/GlobalConstants";
import { decryptJWT } from "./app/lib/auth/auth";
import { cookies } from "next/headers";
import { NextURL } from "next/dist/server/web/next-url";

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

const routes = {
  [GlobalConstants.PUBLIC]: ["/favicon.ico", `/${GlobalConstants.LOGIN}`],
  [GlobalConstants.PRIVATE]: ["/"],
  [GlobalConstants.ADMIN]: [`/${GlobalConstants.MEMBERS}`],
};

const routeHasPrivacyStatus = (
  reqPath: string,
  privacyStatus: string
): boolean => {
  for (let route of routes[privacyStatus]) {
    if (reqPath.startsWith(route)) return true;
  }
  return false;
};

export default async function middleware(req: NextRequest) {
  const reqPath = req.nextUrl.pathname;
  const redirectUrl = new NextURL(req.nextUrl);
  const cookieStore = await cookies();
  const cookie = cookieStore.get(GlobalConstants.USER_CREDENTIALS)?.value;
  const loggedInUser = await decryptJWT(cookie);

  console.log(req.nextUrl);

  redirectUrl.pathname = `/${GlobalConstants.LOGIN}`;
  // Redirect to login from non-public pages if the user is not logged in
  if (!routeHasPrivacyStatus(reqPath, GlobalConstants.PUBLIC) && !loggedInUser)
    return NextResponse.redirect(redirectUrl);

  redirectUrl.pathname = "/";
  // Redirect logged in users from login to home
  if (loggedInUser && reqPath === `/${GlobalConstants.LOGIN}`)
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
