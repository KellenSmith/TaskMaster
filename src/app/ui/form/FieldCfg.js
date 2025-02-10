import GlobalConstants from "../../GlobalConstants";

export const RenderedFields = {
  [GlobalConstants.USER]: [
    GlobalConstants.FIRST_NAME,
    GlobalConstants.SURNAME,
    GlobalConstants.NICKNAME,
    GlobalConstants.EMAIL,
    GlobalConstants.PHONE,
    GlobalConstants.ROLE,
  ],
};

export const RequiredFields = {
  [GlobalConstants.USER]: [
    GlobalConstants.FIRST_NAME,
    GlobalConstants.SURNAME,
    GlobalConstants.NICKNAME,
    GlobalConstants.EMAIL,
    GlobalConstants.PHONE,
    GlobalConstants.ROLE,
  ],
};

export const selectFieldOptions = {
  [GlobalConstants.ROLE]: [GlobalConstants.USER, GlobalConstants.ADMIN],
};
