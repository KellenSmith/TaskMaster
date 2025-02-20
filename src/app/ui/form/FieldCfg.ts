import GlobalConstants from "../../GlobalConstants";

export const FieldLabels = {
    [GlobalConstants.ID]: "ID",
    [GlobalConstants.UPDATE]: "Update",
    [GlobalConstants.DELETE]: "Delete",
    [GlobalConstants.VALIDATE_MEMBERSHIP]: "Validate Membership",
    [GlobalConstants.APPLY]: "Apply For Membership",
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
    // Reset
    [GlobalConstants.RESET]: "Reset",
    // Credentials
    [GlobalConstants.USER_CREDENTIALS]: "User Credentials",
    [GlobalConstants.CURRENT_PASSWORD]: "Current Password",
    [GlobalConstants.NEW_PASSWORD]: "New Password",
    [GlobalConstants.REPEAT_PASSWORD]: "Repeat Password",
    //Event
    [GlobalConstants.TITLE]: "Title",
    [GlobalConstants.LOCATION]: "Location",
    [GlobalConstants.START_TIME]: "Start time",
    [GlobalConstants.END_TIME]: "End time",
    [GlobalConstants.MAX_PARTICIPANTS]: "Maximum no. of participants",
    [GlobalConstants.FULL_TICKET_PRICE]: "Full ticket price",
    [GlobalConstants.DESCRIPTION]: "Description",
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
    // Reset
    [GlobalConstants.RESET]: [GlobalConstants.EMAIL],
    // Credentials
    [GlobalConstants.USER_CREDENTIALS]: [
        GlobalConstants.CURRENT_PASSWORD,
        GlobalConstants.NEW_PASSWORD,
        GlobalConstants.REPEAT_PASSWORD,
    ],
    [GlobalConstants.EVENT]: [
        GlobalConstants.TITLE,
        GlobalConstants.LOCATION,
        GlobalConstants.START_TIME,
        GlobalConstants.END_TIME,
        GlobalConstants.MAX_PARTICIPANTS,
        GlobalConstants.FULL_TICKET_PRICE,
        GlobalConstants.DESCRIPTION,
    ],
};
// Apply
RenderedFields[GlobalConstants.APPLY] = RenderedFields[GlobalConstants.PROFILE];
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
    // Reset
    [GlobalConstants.RESET]: [GlobalConstants.RESET],
    // Credentials
    [GlobalConstants.USER_CREDENTIALS]: [
        GlobalConstants.CURRENT_PASSWORD,
        GlobalConstants.NEW_PASSWORD,
        GlobalConstants.REPEAT_PASSWORD,
    ],
    [GlobalConstants.EVENT]: [
        GlobalConstants.TITLE,
        GlobalConstants.LOCATION,
        GlobalConstants.START_TIME,
        GlobalConstants.END_TIME,
        GlobalConstants.MAX_PARTICIPANTS,
        GlobalConstants.FULL_TICKET_PRICE,
        GlobalConstants.DESCRIPTION,
    ],
};
// Apply
RequiredFields[GlobalConstants.APPLY] = RequiredFields[GlobalConstants.PROFILE];
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
    GlobalConstants.START_TIME,
    GlobalConstants.END_TIME,
];

export const multiLineFields = [
    // Event
    GlobalConstants.DESCRIPTION,
];
