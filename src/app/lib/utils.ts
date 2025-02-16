import { routes } from "./definitions";
import GlobalConstants from "../GlobalConstants";
import { JWTPayload } from "jose";

/**
 * Routes are assumed to have the highest privacy found,
 * unless a more specific matching path is found in a lower privacy group
 */
export const routeHasPrivacyStatus = (
  reqPath: string,
  privacyStatus: string
): boolean => {
  // Routes have to be specified exactly to be considered public
  if (privacyStatus === GlobalConstants.PUBLIC)
    return routes[privacyStatus].map((route) => `/${route}`).includes(reqPath);

  // If the reqPath is nested in an admin or private route, it inherits the privacy
  for (let route of routes[privacyStatus]) {
    if (reqPath.startsWith(`/${route}`)) return true;
  }
  return false;
};

export const isUserAuthorized = (
  path: string,
  user: JWTPayload | null
): boolean => {
  // Only allow non-logged in users access to public routes
  if (!user) return routes[GlobalConstants.PUBLIC].includes(path);
  // Allow admins access to all routes
  if (user[GlobalConstants.ROLE] === GlobalConstants.ADMIN) return true;
  // Allow other users access to everything except admin routes.
  return !routeHasPrivacyStatus(path, GlobalConstants.ADMIN);
};
