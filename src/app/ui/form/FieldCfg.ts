import { Prisma, TaskStatus, TicketType, User, UserRole } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";

export const FieldLabels = {
    [GlobalConstants.ID]: "ID",
    [GlobalConstants.UPDATE]: "Update",
    [GlobalConstants.DELETE]: "Delete",
    [GlobalConstants.VALIDATE_MEMBERSHIP]: "Validate Membership",
    [GlobalConstants.APPLY]: "Apply For Membership",
    // Organization settings
    [GlobalConstants.ORGANIZATION_SETTINGS]: "Settings",
    [GlobalConstants.ORGANIZATION_NAME]: "Organization Name",
    [GlobalConstants.REMIND_MEMBERSHIP_EXPIRES_IN_DAYS]: "Remind Membership Expires In Days",
    [GlobalConstants.PURGE_MEMBERS_AFTER_DAYS_UNVALIDATED]: "Purge Members After Days Unvalidated",
    // Profile
    [GlobalConstants.PROFILE]: "Profile",
    // User
    [GlobalConstants.USER]: "User",
    [GlobalConstants.FIRST_NAME]: "First Name",
    [GlobalConstants.SURNAME]: "Surname",
    [GlobalConstants.NICKNAME]: "Nickname",
    [GlobalConstants.PRONOUN]: "Pronoun",
    [GlobalConstants.EMAIL]: "Email",
    [GlobalConstants.PHONE]: "Phone",
    [GlobalConstants.ROLE]: "Role",
    [GlobalConstants.CREATED_AT]: "Created At",
    [GlobalConstants.UPDATED_AT]: "Updated At",
    [GlobalConstants.CONSENT_TO_NEWSLETTERS]: `I consent to receiving newsletters`,
    [GlobalConstants.CONSENT_GDPR]: "I consent to being added to the member registry",
    [GlobalConstants.PENDING]: "Pending",
    [GlobalConstants.ACTIVE]: "Is member",
    [GlobalConstants.EXPIRED]: "Is not member",
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
    [GlobalConstants.EVENT]: "Event",
    [GlobalConstants.TITLE]: "Title",
    [GlobalConstants.LOCATION]: "Location",
    [GlobalConstants.START_TIME]: "Start time",
    [GlobalConstants.END_TIME]: "End time",
    [GlobalConstants.MAX_PARTICIPANTS]: "Maximum no. of participants",
    [GlobalConstants.FULL_TICKET_PRICE]: "Full ticket price",
    [GlobalConstants.DESCRIPTION]: "Description",
    [GlobalConstants.HOST]: "Host",
    // Task
    [GlobalConstants.TASK]: "Task",
    [GlobalConstants.NAME]: "Name",
    [GlobalConstants.ASSIGNEE]: "Assignee",
    [GlobalConstants.ASSIGNEE_ID]: "Assignee",
    [GlobalConstants.REVIEWER]: "Reviewer",
    [GlobalConstants.REVIEWER_ID]: "Reviewer",
    [GlobalConstants.PHASE]: "Phase",
    [GlobalConstants.TAGS]: "Tags",
    [GlobalConstants.PHASE]: "Phase",
    [GlobalConstants.STATUS]: "Status",
    [GlobalConstants.BEFORE]: "Before",
    [GlobalConstants.DURING]: "During",
    [GlobalConstants.AFTER]: "After",
    [GlobalConstants.TO_DO]: "To Do",
    [GlobalConstants.IN_PROGRESS]: "In Progress",
    [GlobalConstants.IN_REVIEW]: "In Review",
    [GlobalConstants.DONE]: "Done",
    // Sendout
    [GlobalConstants.SENDOUT]: "Sendout",
    [GlobalConstants.SUBJECT]: "Subject",
    [GlobalConstants.CONTENT]: "Content",
    // Product
    [GlobalConstants.PRODUCT]: "Product",
    [GlobalConstants.PRICE]: "Price",
    [GlobalConstants.STOCK]: "Stock",
    [GlobalConstants.UNLIMITED_STOCK]: "Unlimited Stock",
    [GlobalConstants.IMAGE_URL]: "Image URL",
    // Ticket
    [GlobalConstants.TICKET]: "Ticket",
    [GlobalConstants.TICKET_TYPE]: "Type",
};

export const RenderedFields = {
    // Org settings
    [GlobalConstants.ORGANIZATION_SETTINGS]: [
        GlobalConstants.ORGANIZATION_NAME,
        GlobalConstants.REMIND_MEMBERSHIP_EXPIRES_IN_DAYS,
        GlobalConstants.PURGE_MEMBERS_AFTER_DAYS_UNVALIDATED,
        GlobalConstants.EMAIL,
    ],
    // Profile
    [GlobalConstants.PROFILE]: [
        GlobalConstants.FIRST_NAME,
        GlobalConstants.SURNAME,
        GlobalConstants.NICKNAME,
        GlobalConstants.EMAIL,
        GlobalConstants.PRONOUN,
        GlobalConstants.PHONE,
        GlobalConstants.CONSENT_TO_NEWSLETTERS,
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
        GlobalConstants.DESCRIPTION,
    ],
    [GlobalConstants.TASK]: [
        GlobalConstants.NAME,
        GlobalConstants.STATUS,
        GlobalConstants.PHASE,
        GlobalConstants.ASSIGNEE_ID,
        GlobalConstants.REVIEWER_ID,
        GlobalConstants.START_TIME,
        GlobalConstants.END_TIME,
        GlobalConstants.DESCRIPTION,
        GlobalConstants.TAGS,
    ],
    [GlobalConstants.SENDOUT]: [GlobalConstants.SUBJECT, GlobalConstants.CONTENT],
    [GlobalConstants.PRODUCT]: [
        GlobalConstants.NAME,
        GlobalConstants.PRICE,
        GlobalConstants.STOCK,
        GlobalConstants.UNLIMITED_STOCK,
        GlobalConstants.IMAGE_URL,
        GlobalConstants.DESCRIPTION,
    ],
    [GlobalConstants.TEXT_CONTENT]: [GlobalConstants.CONTENT],
    [GlobalConstants.ORDER]: [GlobalConstants.STATUS],
};
RenderedFields[GlobalConstants.TICKET] = [
    GlobalConstants.TICKET_TYPE,
    ...RenderedFields[GlobalConstants.PRODUCT].filter(
        (fieldId) => ![GlobalConstants.STOCK, GlobalConstants.UNLIMITED_STOCK].includes(fieldId),
    ),
];
RenderedFields[GlobalConstants.MEMBERSHIP] = [
    ...RenderedFields[GlobalConstants.PRODUCT],
    GlobalConstants.DURATION,
];
// Apply
RenderedFields[GlobalConstants.APPLY] = [
    ...RenderedFields[GlobalConstants.PROFILE],
    GlobalConstants.CONSENT_GDPR,
];
// User
RenderedFields[GlobalConstants.USER] = [
    ...RenderedFields[GlobalConstants.PROFILE],
    GlobalConstants.ROLE,
];

export const RequiredFields = {
    // Org settings
    [GlobalConstants.ORGANIZATION_SETTINGS]: [
        GlobalConstants.ORGANIZATION_NAME,
        GlobalConstants.REMIND_MEMBERSHIP_EXPIRES_IN_DAYS,
        GlobalConstants.PURGE_MEMBERS_AFTER_DAYS_UNVALIDATED,
        GlobalConstants.EMAIL,
    ],
    // Profile
    [GlobalConstants.PROFILE]: [
        GlobalConstants.FIRST_NAME,
        GlobalConstants.SURNAME,
        GlobalConstants.NICKNAME,
        GlobalConstants.EMAIL,
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
    [GlobalConstants.TASK]: [
        GlobalConstants.NAME,
        GlobalConstants.STATUS,
        GlobalConstants.REVIEWER,
    ],
    [GlobalConstants.SENDOUT]: [GlobalConstants.SUBJECT, GlobalConstants.CONTENT],
    [GlobalConstants.PRODUCT]: [GlobalConstants.NAME, GlobalConstants.PRICE],
};
RequiredFields[GlobalConstants.TICKET] = [
    ...RequiredFields[GlobalConstants.PRODUCT],
    GlobalConstants.TICKET_TYPE,
];
// Apply
RequiredFields[GlobalConstants.APPLY] = [
    ...RequiredFields[GlobalConstants.PROFILE],
    GlobalConstants.CONSENT_GDPR,
];
// User
RequiredFields[GlobalConstants.USER] = [
    ...RequiredFields[GlobalConstants.PROFILE],
    GlobalConstants.ROLE,
];
RequiredFields[GlobalConstants.MEMBERSHIP] = [
    ...RequiredFields[GlobalConstants.PRODUCT],
    GlobalConstants.DURATION,
];

export const passwordFields = [
    GlobalConstants.PASSWORD,
    GlobalConstants.CURRENT_PASSWORD,
    GlobalConstants.NEW_PASSWORD,
    GlobalConstants.REPEAT_PASSWORD,
];

export const selectFieldOptions = {
    // User
    [GlobalConstants.ROLE]: Object.values(UserRole),
    [GlobalConstants.PHASE]: [
        GlobalConstants.BEFORE,
        GlobalConstants.DURING,
        GlobalConstants.AFTER,
    ],
    [GlobalConstants.STATUS]: Object.values(TaskStatus),
    [GlobalConstants.TAGS]: ["Location", "Decoration", "Wardrobe", "Bartending", "Music"],
    [GlobalConstants.TICKET_TYPE]: Object.values(TicketType),
} as { [key: string]: string[] };

export const formatAssigneeOptions = (activeMembers: any[]) => {
    if (!activeMembers || activeMembers.length < 1) return [];
    return activeMembers.map((member) => ({
        value: member[GlobalConstants.ID],
        label: member[GlobalConstants.NICKNAME],
    }));
};

export const allowSelectMultiple = [GlobalConstants.TAGS];

export const datePickerFields = [
    GlobalConstants.CREATED_AT,
    GlobalConstants.UPDATED_AT,
    GlobalConstants.START_TIME,
    GlobalConstants.END_TIME,
];

export const richTextFields = [
    // Event
    GlobalConstants.DESCRIPTION,
    // Sendout
    GlobalConstants.CONTENT,
];

export const checkboxFields = [
    GlobalConstants.CONSENT_TO_NEWSLETTERS,
    GlobalConstants.CONSENT_GDPR,
    GlobalConstants.UNLIMITED_STOCK,
];

export const priceFields = [GlobalConstants.PRICE, GlobalConstants.TOTAL_AMOUNT];

export const getUserSelectOptions = (
    users: Prisma.UserGetPayload<{ select: { id: true; nickname: true } }>[],
) => {
    return users.map((user) => ({
        id: user.id,
        label: user.nickname,
    }));
};
