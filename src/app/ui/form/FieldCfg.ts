import GlobalConstants from "../../GlobalConstants";

export const RenderedFields = {
  [GlobalConstants.USER]: [
    GlobalConstants.FIRST_NAME,
    GlobalConstants.SURNAME,
    GlobalConstants.NICKNAME,
    GlobalConstants.EMAIL,
    GlobalConstants.PHONE,
    GlobalConstants.ROLE,
    GlobalConstants.MEMBER_SINCE,
    GlobalConstants.MEMBERSHIP_RENEWED_AT,
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

export const datePickerFields = [
  GlobalConstants.MEMBER_SINCE,
  GlobalConstants.MEMBERSHIP_RENEWED_AT,
];
