"user server";

import { NextRequest, NextResponse } from "next/server";
import GlobalConstants from "./app/GlobalConstants";
import { decryptJWT, getUserByUniqueKey } from "./app/lib/auth/auth";
import { cookies } from "next/headers";
import { NextURL } from "next/dist/server/web/next-url";

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

const routes = {
  public: ["/favicon.ico", `/${GlobalConstants.LOGIN}`],
  private: ["/"],
  admin: [`/${GlobalConstants.MEMBERS}`],
};

export default async function middleware(req: NextRequest) {
  const reqPath = req.nextUrl.pathname;
  const redirectUrl = new NextURL(req.nextUrl);
  const cookieStore = await cookies();
  const cookie = cookieStore.get(GlobalConstants.USER_CREDENTIALS)?.value;
  const jwtPayload = await decryptJWT(cookie);

  redirectUrl.pathname = `/${GlobalConstants.LOGIN}`;
  // Redirect to login from non-public pages if the user is not logged in
  if (!routes.public.includes(reqPath) && !jwtPayload)
    return NextResponse.redirect(redirectUrl);

  redirectUrl.pathname = "/";
  // Redirect logged in users from login to home
  if (jwtPayload && reqPath === `/${GlobalConstants.LOGIN}`)
    return NextResponse.redirect(redirectUrl);

  // Redirect non-admins to home from admin pages or login
  if (routes.admin.includes(reqPath)) {
    const loggedInUser = await getUserByUniqueKey(
      GlobalConstants.ID,
      jwtPayload[GlobalConstants.ID] as string
    );
    const userIsAdmin =
      loggedInUser[GlobalConstants.ROLE] === GlobalConstants.ADMIN;
    if (!userIsAdmin) return NextResponse.redirect(redirectUrl);
  }

  // Allow logged in users to access all private routes
  return NextResponse.next();
}
