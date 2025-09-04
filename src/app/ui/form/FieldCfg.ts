import { Language, Prisma, TaskStatus, TicketType, UserRole } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";
import { isUserQualifiedForTask as isUserQualifiedForTask } from "../utils";
import {
    eventFieldLabels,
    locationFieldLabels,
    orderFieldLabels,
    organizationSettingsFieldLabels,
    productFieldLabels,
    sendoutFieldLabels,
    skillBadgeFieldLabels,
    taskFieldLabels,
    textContentFieldLabels,
    ticketFieldLabels,
    userCredentialsFieldLabels,
    userFieldLabels,
} from "./LanguageTranslations";
import { CustomOptionProps } from "./AutocompleteWrapper";

export const FieldLabels = {
    [GlobalConstants.ID]: {
        [Language.english]: "Id",
        [Language.swedish]: "Id",
    },
    ...organizationSettingsFieldLabels,
    ...textContentFieldLabels,
    ...userFieldLabels,
    ...userCredentialsFieldLabels,
    ...eventFieldLabels,
    ...locationFieldLabels,
    ...taskFieldLabels,
    ...sendoutFieldLabels,
    ...productFieldLabels,
    ...ticketFieldLabels,
    ...skillBadgeFieldLabels,
    ...orderFieldLabels,
};

export const explanatoryTexts = {
    [GlobalConstants.ORGANIZATION_NAME]: {
        [Language.english]:
            "The name of the organization which will be displayed all over the application",
        [Language.swedish]: "Namnet på organisationen som kommer att visas över hela applikationen",
    },
    [GlobalConstants.ORGANIZATION_EMAIL]: {
        [Language.english]:
            "The email address which automated emails are sent from and should be monitored for replies",
        [Language.swedish]:
            "E-postadressen som automatiserade e-postmeddelanden skickas från och som bör övervakas för svar",
    },
    [GlobalConstants.EVENT_MANAGER_EMAIL]: {
        [Language.english]:
            "If given, events must be submitted for approval before publishing to the calendar. This email will receive a notification.",
        [Language.swedish]:
            "Om den anges måste evenemang skickas in för godkännande innan de publiceras i kalendern. Denna e-postadress kommer att få en notis.",
    },
    [GlobalConstants.DEFAULT_TASK_SHIFT_LENGTH]: {
        [Language.english]:
            "The default length of task shifts when added from a task board belonging to an event",
        [Language.swedish]:
            "Standardlängden för arbetsuppgifter när de läggs till från en att-göralista som tillhör ett evenemang",
    },
    [GlobalConstants.REMIND_MEMBERSHIP_EXPIRES_IN_DAYS]: {
        [Language.english]:
            "Members whose membership expires in X days will automatically be sent an email reminder",
        [Language.swedish]:
            "Medlemmar vars medlemskap går ut om X dagar kommer automatiskt att få en påminnelse via e-post",
    },
    [GlobalConstants.PURGE_MEMBERS_AFTER_DAYS_UNVALIDATED]: {
        [Language.english]:
            "Members whose membership has not been validated after X days will automatically be purged from the database",
        [Language.swedish]:
            "Medlemmar vars medlemskap inte har validerats efter X dagar kommer automatiskt att tas bort från databasen",
    },
    [GlobalConstants.MEMBER_APPLICATION_PROMPT]: {
        [Language.english]:
            "If given, this text will be displayed as a prompt for member applications and applications can not be submitted without a message. If this field is left empty, applications can be submitted without a message.",
        [Language.swedish]:
            "Om den anges kommer denna text att visas som en uppmaning för medlemsansökningar och ansökningar kan inte skickas utan ett meddelande. Om detta fält lämnas tomt kan ansökningar skickas utan ett meddelande.",
    },
};

export const RenderedFields = {
    // Org settings
    [GlobalConstants.ORGANIZATION_SETTINGS]: [
        GlobalConstants.ORGANIZATION_NAME,
        GlobalConstants.ORGANIZATION_EMAIL,
        GlobalConstants.EVENT_MANAGER_EMAIL,
        GlobalConstants.DEFAULT_TASK_SHIFT_LENGTH,
        GlobalConstants.REMIND_MEMBERSHIP_EXPIRES_IN_DAYS,
        GlobalConstants.PURGE_MEMBERS_AFTER_DAYS_UNVALIDATED,
        GlobalConstants.MEMBER_APPLICATION_PROMPT,
        GlobalConstants.LOGO_URL,
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
    [GlobalConstants.ADD_MEMBERSHIP]: [GlobalConstants.EXPIRES_AT],
    [GlobalConstants.EVENT]: [
        GlobalConstants.TITLE,
        GlobalConstants.LOCATION_ID,
        GlobalConstants.START_TIME,
        GlobalConstants.END_TIME,
        GlobalConstants.MAX_PARTICIPANTS,
        GlobalConstants.DESCRIPTION,
        GlobalConstants.TAGS,
    ],
    [GlobalConstants.CLONE_EVENT]: [GlobalConstants.START_TIME],
    [GlobalConstants.LOCATION]: [
        GlobalConstants.NAME,
        GlobalConstants.CONTACT_PERSON,
        GlobalConstants.RENTAL_COST,
        GlobalConstants.ADDRESS,
        GlobalConstants.CAPACITY,
        GlobalConstants.ACCESSIBILITY_INFO,
        GlobalConstants.DESCRIPTION,
    ],
    [GlobalConstants.LOCATION_ID]: [GlobalConstants.LOCATION_ID],
    [GlobalConstants.TASK]: [
        GlobalConstants.NAME,
        GlobalConstants.STATUS,
        GlobalConstants.ASSIGNEE_ID,
        GlobalConstants.REVIEWER_ID,
        GlobalConstants.START_TIME,
        GlobalConstants.END_TIME,
        GlobalConstants.TAGS,
        GlobalConstants.SKILL_BADGES,
        GlobalConstants.DESCRIPTION,
    ],
    [GlobalConstants.SENDOUT]: [GlobalConstants.SUBJECT, GlobalConstants.CONTENT],
    [GlobalConstants.PRODUCT]: [
        GlobalConstants.NAME,
        GlobalConstants.PRICE,
        GlobalConstants.STOCK,
        GlobalConstants.UNLIMITED_STOCK,
        GlobalConstants.DESCRIPTION,
        GlobalConstants.IMAGE_URL,
    ],
    [GlobalConstants.SKILL_BADGE]: [
        GlobalConstants.NAME,
        GlobalConstants.DESCRIPTION,
        GlobalConstants.IMAGE_URL,
    ],
    [GlobalConstants.TEXT_CONTENT]: [GlobalConstants.TEXT],
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
    GlobalConstants.SKILL_BADGES,
];

export const RequiredFields = {
    // Org settings
    [GlobalConstants.ORGANIZATION_SETTINGS]: [
        GlobalConstants.ORGANIZATION_NAME,
        GlobalConstants.REMIND_MEMBERSHIP_EXPIRES_IN_DAYS,
        GlobalConstants.PURGE_MEMBERS_AFTER_DAYS_UNVALIDATED,
        GlobalConstants.ORGANIZATION_EMAIL,
    ],
    [GlobalConstants.TEXT_CONTENT]: [GlobalConstants.TEXT],
    // Profile
    [GlobalConstants.PROFILE]: [
        GlobalConstants.FIRST_NAME,
        GlobalConstants.SURNAME,
        GlobalConstants.NICKNAME,
        GlobalConstants.EMAIL,
    ],
    [GlobalConstants.ADD_MEMBERSHIP]: [GlobalConstants.EXPIRES_AT],
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
        GlobalConstants.LOCATION_ID,
        GlobalConstants.START_TIME,
        GlobalConstants.END_TIME,
        GlobalConstants.MAX_PARTICIPANTS,
        GlobalConstants.FULL_TICKET_PRICE,
        GlobalConstants.DESCRIPTION,
    ],
    [GlobalConstants.LOCATION_ID]: [GlobalConstants.LOCATION_ID],
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
    [GlobalConstants.STATUS]: Object.values(TaskStatus),
    [GlobalConstants.TICKET_TYPE]: Object.values(TicketType),
};

export const allowSelectMultiple = [GlobalConstants.TAGS, GlobalConstants.SKILL_BADGES];
export const allowAddNew = [GlobalConstants.TAGS];

export const datePickerFields = [
    GlobalConstants.CREATED_AT,
    GlobalConstants.UPDATED_AT,
    GlobalConstants.START_TIME,
    GlobalConstants.END_TIME,
    GlobalConstants.EXPIRES_AT,
];

export const richTextFields = [
    // Text content
    GlobalConstants.TEXT,
    // Event
    GlobalConstants.DESCRIPTION,
    // Sendout
    GlobalConstants.CONTENT,
];

export const checkboxFields = [
    GlobalConstants.CONSENT_TO_NEWSLETTERS,
    GlobalConstants.CONSENT_GDPR,
    GlobalConstants.UNLIMITED_STOCK,
    GlobalConstants.PAYMENT_REQUEST_ID,
    GlobalConstants.PAYEE_REF,
];

export const priceFields = [GlobalConstants.PRICE, GlobalConstants.TOTAL_AMOUNT];

export const getUserSelectOptions = (
    users: Prisma.UserGetPayload<{
        select: { id: true; nickname: true; skill_badges: true };
    }>[],
    requiredTaskSkillBadges: Prisma.TaskSkillBadgeGetPayload<true>[] = [],
) => {
    const qualifiedMembers = users.filter((user) =>
        isUserQualifiedForTask(user, requiredTaskSkillBadges),
    );
    return qualifiedMembers.map((user) => ({
        id: user.id,
        label: user.nickname,
    }));
};

export const stringsToSelectOptions = (strings: string[]): CustomOptionProps[] => {
    return strings.map((str) => ({
        id: str,
        label: str,
    }));
};

export const multiLineTextFields = [
    GlobalConstants.MEMBER_APPLICATION_PROMPT,
    GlobalConstants.ACCESSIBILITY_INFO,
];

export const fileUploadFields = [GlobalConstants.LOGO_URL, GlobalConstants.IMAGE_URL];
