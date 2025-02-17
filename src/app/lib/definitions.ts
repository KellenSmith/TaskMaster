import { JWTPayload } from "jose";
import GlobalConstants from "../GlobalConstants";

export const routes = {
  [GlobalConstants.ADMIN]: [`${GlobalConstants.MEMBERS}`],
  [GlobalConstants.PRIVATE]: [`${GlobalConstants.PROFILE}`],
  [GlobalConstants.PUBLIC]: [
    `${GlobalConstants.HOME}`,
    `${GlobalConstants.LOGIN}`,
    `${GlobalConstants.APPLY}`,
  ],
};

export const routesToPath = (routeList: string[]) =>
  routeList.map((route) => `/${route}`);

export const isUserAuthorized = (
  path: string,
  user: JWTPayload | null
): boolean => {
  // Only allow non-logged in users access to public routes
  if (!user) return routesToPath(routes[GlobalConstants.PUBLIC]).includes(path);
  // Allow admins access to all routes
  if (user[GlobalConstants.ROLE] === GlobalConstants.ADMIN) return true;
  // Allow regular users access to everything except admin routes.
  return !routesToPath(routes[GlobalConstants.ADMIN]).includes(path);
};
