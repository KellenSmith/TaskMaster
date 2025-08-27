import { Prisma, TaskStatus, TicketType, UserRole } from "@prisma/client";
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
    [GlobalConstants.DEFAULT_TASK_SHIFT_LENGTH]: "Default Task Shift Length [hours]",
    [GlobalConstants.REMIND_MEMBERSHIP_EXPIRES_IN_DAYS]: "Remind before membership expires [days]",
    [GlobalConstants.PURGE_MEMBERS_AFTER_DAYS_UNVALIDATED]:
        "Purge Members After Time Unvalidated [days]",
    [GlobalConstants.MEMBER_APPLICATION_PROMPT]: "Send us a message",
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
    [GlobalConstants.ACTIVE]: "Active",
    [GlobalConstants.EXPIRED]: "Expired",
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
    [GlobalConstants.PARTICIPANT_USERS]: "Participants",
    [GlobalConstants.RESERVE_USERS]: "Reserves",
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
    [GlobalConstants.TICKET]: "Ticket",
    [GlobalConstants.TICKET_TYPE]: "Type",
};

export const explanatoryTexts = {
    [GlobalConstants.ORGANIZATION_NAME]:
        "The name of the organization which will be displayed all over the application",
    [GlobalConstants.ORGANIZATION_EMAIL]:
        "The email address which automated emails are sent from and should be monitored for replies",
    [GlobalConstants.DEFAULT_TASK_SHIFT_LENGTH]:
        "The default length of task shifts when added from a task board belonging to an event",
    [GlobalConstants.REMIND_MEMBERSHIP_EXPIRES_IN_DAYS]:
        "Members whose membership expires in X days will automatically be sent an email reminder",
    [GlobalConstants.PURGE_MEMBERS_AFTER_DAYS_UNVALIDATED]:
        "Members whose membership has not been validated after X days will automatically be purged from the database",
    [GlobalConstants.MEMBER_APPLICATION_PROMPT]:
        "If given, this text will be displayed as a prompt for member applications and applications can not be submitted without a message. If this field is left empty, applications can be submitted without a message.",
};

export const RenderedFields = {
    // Org settings
    [GlobalConstants.ORGANIZATION_SETTINGS]: [
        GlobalConstants.ORGANIZATION_NAME,
        GlobalConstants.ORGANIZATION_EMAIL,
        GlobalConstants.DEFAULT_TASK_SHIFT_LENGTH,
        GlobalConstants.REMIND_MEMBERSHIP_EXPIRES_IN_DAYS,
        GlobalConstants.PURGE_MEMBERS_AFTER_DAYS_UNVALIDATED,
        GlobalConstants.MEMBER_APPLICATION_PROMPT,
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
        GlobalConstants.TAGS,
        GlobalConstants.DESCRIPTION,
    ],
    [GlobalConstants.SENDOUT]: [GlobalConstants.SUBJECT, GlobalConstants.CONTENT],
    [GlobalConstants.PRODUCT]: [
        GlobalConstants.NAME,
        GlobalConstants.PRICE,
        GlobalConstants.STOCK,
        GlobalConstants.UNLIMITED_STOCK,
        GlobalConstants.DESCRIPTION,
    ],
    [GlobalConstants.TEXT_CONTENT]: [GlobalConstants.CONTENT],
    [GlobalConstants.ORDER]: [GlobalConstants.STATUS],
    [GlobalConstants.PARTICIPANT_USERS]: [GlobalConstants.USER_ID, GlobalConstants.TICKET_ID],
    [GlobalConstants.RESERVE_USERS]: [GlobalConstants.USER_ID],
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
        GlobalConstants.ORGANIZATION_EMAIL,
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
    [GlobalConstants.PARTICIPANT_USERS]: RenderedFields[GlobalConstants.PARTICIPANT_USERS],
    [GlobalConstants.RESERVE_USERS]: RenderedFields[GlobalConstants.RESERVE_USERS],
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
    [GlobalConstants.PHASE]: Object.values(TaskStatus),
    [GlobalConstants.STATUS]: Object.values(TaskStatus),
    [GlobalConstants.TAGS]: ["Location", "Decoration", "Wardrobe", "Bartending", "Music"],
    [GlobalConstants.TICKET_TYPE]: Object.values(TicketType),
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

export const multiLineTextFields = [GlobalConstants.MEMBER_APPLICATION_PROMPT];
