import GlobalConstants from "../../GlobalConstants";

export const FieldLabels = {
  // User
  [GlobalConstants.USER]: "User",
  [GlobalConstants.FIRST_NAME]: "First Name",
  [GlobalConstants.SURNAME]: "Surname",
  [GlobalConstants.NICKNAME]: "Nickname",
  [GlobalConstants.EMAIL]: "Email",
  [GlobalConstants.PHONE]: "Phone",
  [GlobalConstants.ROLE]: "Role",
  [GlobalConstants.MEMBER_SINCE]: "Member Since",
  [GlobalConstants.MEMBERSHIP_RENEWED_AT]: "Membership Renewed At",
  // Login
  [GlobalConstants.LOGIN]: "Login",
  [GlobalConstants.PASSWORD]: "Password",
};

export const RenderedFields = {
  // User
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
  // Login
  [GlobalConstants.LOGIN]: [GlobalConstants.EMAIL, GlobalConstants.PASSWORD],
};

export const RequiredFields = {
  // User
  [GlobalConstants.USER]: [
    GlobalConstants.FIRST_NAME,
    GlobalConstants.SURNAME,
    GlobalConstants.NICKNAME,
    GlobalConstants.EMAIL,
    GlobalConstants.PHONE,
    GlobalConstants.ROLE,
  ],
  // Login
  [GlobalConstants.LOGIN]: [GlobalConstants.EMAIL, GlobalConstants.PASSWORD],
};

export const selectFieldOptions = {
  // User
  [GlobalConstants.ROLE]: [GlobalConstants.USER, GlobalConstants.ADMIN],
};

export const datePickerFields = [
  // User
  GlobalConstants.MEMBER_SINCE,
  GlobalConstants.MEMBERSHIP_RENEWED_AT,
];
