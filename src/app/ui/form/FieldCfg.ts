import GlobalConstants from "../../GlobalConstants";

export const FieldLabels = {
  // Profile
  [GlobalConstants.PROFILE]: "Profile",
  // User
  [GlobalConstants.USER]: "User",
  [GlobalConstants.FIRST_NAME]: "First Name",
  [GlobalConstants.SURNAME]: "Surname",
  [GlobalConstants.NICKNAME]: "Nickname",
  [GlobalConstants.EMAIL]: "Email",
  [GlobalConstants.PHONE]: "Phone",
  // Login
  [GlobalConstants.LOGIN]: "Login",
  [GlobalConstants.PASSWORD]: "Password",
  // Credentials
  [GlobalConstants.USER_CREDENTIALS]: "User Credentials",
  [GlobalConstants.CURRENT_PASSWORD]: "Current Password",
  [GlobalConstants.NEW_PASSWORD]: "New Password",
  [GlobalConstants.REPEAT_PASSWORD]: "Repeat Password",
};

export const RenderedFields = {
  // Profile
  [GlobalConstants.PROFILE]: [
    GlobalConstants.FIRST_NAME,
    GlobalConstants.SURNAME,
    GlobalConstants.NICKNAME,
    GlobalConstants.EMAIL,
    GlobalConstants.PHONE,
  ],
  // Login
  [GlobalConstants.LOGIN]: [GlobalConstants.EMAIL, GlobalConstants.PASSWORD],
  // Credentials
  [GlobalConstants.USER_CREDENTIALS]: [
    GlobalConstants.CURRENT_PASSWORD,
    GlobalConstants.NEW_PASSWORD,
    GlobalConstants.REPEAT_PASSWORD,
  ],
};
// User
RenderedFields[GlobalConstants.USER] = [
  ...RenderedFields[GlobalConstants.PROFILE],
  GlobalConstants.ROLE,
  GlobalConstants.MEMBER_SINCE,
  GlobalConstants.MEMBERSHIP_RENEWED_AT,
];

export const RequiredFields = {
  // Profile
  [GlobalConstants.PROFILE]: [
    GlobalConstants.FIRST_NAME,
    GlobalConstants.SURNAME,
    GlobalConstants.NICKNAME,
    GlobalConstants.EMAIL,
    GlobalConstants.PHONE,
  ],
  // Login
  [GlobalConstants.LOGIN]: [GlobalConstants.EMAIL, GlobalConstants.PASSWORD],
  // Credentials
  [GlobalConstants.USER_CREDENTIALS]: [
    GlobalConstants.CURRENT_PASSWORD,
    GlobalConstants.NEW_PASSWORD,
    GlobalConstants.REPEAT_PASSWORD,
  ],
};
// User
RequiredFields[GlobalConstants.USER] = [
  ...RenderedFields[GlobalConstants.PROFILE],
  GlobalConstants.ROLE,
  GlobalConstants.MEMBER_SINCE,
  GlobalConstants.MEMBERSHIP_RENEWED_AT,
];

export const selectFieldOptions = {
  // User
  [GlobalConstants.ROLE]: [GlobalConstants.USER, GlobalConstants.ADMIN],
};

export const datePickerFields = [
  // User
  GlobalConstants.MEMBER_SINCE,
  GlobalConstants.MEMBERSHIP_RENEWED_AT,
];
