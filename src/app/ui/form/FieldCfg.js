import GlobalConstants from "@/app/GlobalConstants";

export const RenderedFields = {
  [GlobalConstants.USER]: [
    GlobalConstants.FIRST_NAME,
    GlobalConstants.SURNAME,
    GlobalConstants.NICKNAME,
    GlobalConstants.EMAIL,
    GlobalConstants.PHONE,
    GlobalConstants.ROLE,
    GlobalConstants.STATUS,
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
    GlobalConstants.STATUS,
  ],
};

export const selectFieldOptions = {
  [GlobalConstants.ROLE]: [GlobalConstants.USER, GlobalConstants.ADMIN],
  [GlobalConstants.STATUS]: [
    GlobalConstants.PENDING,
    GlobalConstants.ACTIVE,
    GlobalConstants.EXPIRED,
  ],
};
