import GlobalConstants from "../../GlobalConstants";

export const FieldLabels = {
  [GlobalConstants.ID]: "ID",
  // Profile
  [GlobalConstants.PROFILE]: "Profile",
  // User
  [GlobalConstants.USER]: "User",
  [GlobalConstants.FIRST_NAME]: "First Name",
  [GlobalConstants.SURNAME]: "Surname",
  [GlobalConstants.NICKNAME]: "Nickname",
  [GlobalConstants.EMAIL]: "Email",
  [GlobalConstants.PHONE]: "Phone",
  [GlobalConstants.ROLE]: "Role",
  [GlobalConstants.CREATED]: "Created",
  [GlobalConstants.MEMBERSHIP_RENEWED]: "Membership Renewed",
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
];

export const selectFieldOptions = {
  // User
  [GlobalConstants.ROLE]: [GlobalConstants.USER, GlobalConstants.ADMIN],
};

export const datePickerFields = [
  // User
  GlobalConstants.CREATED,
  GlobalConstants.MEMBERSHIP_RENEWED,
];
