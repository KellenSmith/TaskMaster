import GlobalConstants from "../GlobalConstants";

export const routes = {
  [GlobalConstants.PUBLIC]: [
    "/favicon.ico",
    `${GlobalConstants.HOME}`,
    `/${GlobalConstants.LOGIN}`,
  ],
  [GlobalConstants.PRIVATE]: [`/${GlobalConstants.PROFILE}`],
  [GlobalConstants.ADMIN]: [`/${GlobalConstants.MEMBERS}`],
};
