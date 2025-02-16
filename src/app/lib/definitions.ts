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
