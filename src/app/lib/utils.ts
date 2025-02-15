import { routes } from "./definitions";
import GlobalConstants from "../GlobalConstants";
import { JWTPayload } from "jose";

export const pathHasPrivacyStatus = (
  reqPath: string,
  privacyStatus: string,
): boolean => {
  for (let route of routes[privacyStatus]) {
    if (reqPath.startsWith(route)) return true;
  }
  return false;
};

export const isUserAuthorized = (
  path: string,
  user: JWTPayload | null,
): boolean => {
  // Only allow non-logged in users access to public routes
  if (!user) return routes[GlobalConstants.PUBLIC].includes(path);
  // Allow admins access to all routes
  if (user[GlobalConstants.ROLE] === GlobalConstants.ADMIN) return true;
  // Allow other users access to everything except admin routes.
  return !pathHasPrivacyStatus(path, GlobalConstants.ADMIN);
};
