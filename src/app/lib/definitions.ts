import GlobalConstants from "../GlobalConstants";

export const routes = {
  [GlobalConstants.PUBLIC]: [
    `${GlobalConstants.HOME}`,
    `${GlobalConstants.LOGIN}`,
  ],
  [GlobalConstants.PRIVATE]: [`${GlobalConstants.PROFILE}`],
  [GlobalConstants.ADMIN]: [`${GlobalConstants.MEMBERS}`],
};
