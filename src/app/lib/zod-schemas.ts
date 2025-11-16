import { z } from "zod";
import { UserRole, EventStatus, TaskStatus, TicketType, OrderStatus, Prisma } from "@prisma/client";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

// Required dayjs to string schema for create operations
const stringToISODate = z
    .string()
    .refine((val) => !val || dayjs.utc(val, "DD/MM/YYYY HH:mm").isValid(), {
        message: "Invalid date",
    })
    .transform((val) =>
        val ? dayjs.utc(val, "DD/MM/YYYY HH:mm").format() : "",
    ) as z.ZodType<string>;

const priceSchema = z.coerce
    .number()
    .nonnegative()
    .transform((val) => Math.round(val * 100));

const selectMultipleSchema = z
    .string()
    .transform((val) => (val ? val.split(",") : []))
    .optional();

const switchButtonSchema = z.string().transform((val) => (val === "on" ? true : false));

// UUID validation schema for ID parameters
const uuidSchema = z.uuid();

// =============================================================================
// ENUM SCHEMAS - Derived from Prisma enums
// =============================================================================

export const UserRoleSchema = z.enum(UserRole);
export const EventStatusSchema = z.enum(EventStatus);
export const TaskStatusSchema = z.enum(TaskStatus);
export const TicketTypeSchema = z.enum(TicketType);
export const OrderStatusSchema = z.enum(OrderStatus);

// =============================================================================
// ORGANIZATION SETTINGS SCHEMAS
// =============================================================================

// Organization settings are never created from forms, only updated

export const OrganizationSettingsUpdateSchema = z
    .object({
        id: z.string().optional(),
        event_manager_email: z.union([z.email().nullable().optional(), z.literal("")]),
        remind_membership_expires_in_days: z.coerce.number().int().positive().optional(),
        purge_members_after_days_unvalidated: z.coerce.number().int().positive().optional(),
        default_task_shift_length: z.coerce.number().int().positive().optional(),
        member_application_prompt: z.string().nullable().optional(),
        logo_url: z.url().nullable().optional(),
        primary_color: z
            .string()
            .regex(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: "Invalid hex color" })
            .nullable()
            .optional(),
        privacy_policy_swedish_url: z.url().nullable().optional(),
        privacy_policy_english_url: z.url().nullable().optional(),
        terms_of_purchase_swedish_url: z.url().nullable().optional(),
        terms_of_purchase_english_url: z.url().nullable().optional(),
        terms_of_membership_swedish_url: z.url().nullable().optional(),
        terms_of_membership_english_url: z.url().nullable().optional(),
    })
    .omit({ id: true });

// =============================================================================
// INFO PAGE SCHEMAS
// =============================================================================

export const InfoPageCreateSchema = z.object({
    title: z.string().min(2).max(100),
    lowest_allowed_user_role: z.union([UserRoleSchema, z.literal("")]),
});

export const InfoPageUpdateSchema = InfoPageCreateSchema.partial();

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const UserCreateSchema = z.object({
    id: z.string().optional(),
    email: z.email().toLowerCase(),
    nickname: z.string().optional(),
    role: UserRoleSchema.optional(),
    consent_to_newsletters: z.coerce.boolean().optional(),

    first_name: z.string().optional(),
    sur_name: z.string().optional(),
    pronoun: z.string().optional(),
    phone: z.string().optional(),

    skill_badges: selectMultipleSchema,
});

export const UserUpdateSchema = UserCreateSchema.partial();

// =============================================================================
// LOCATION SCHEMAS
// =============================================================================

export const LocationCreateSchema = z.object({
    name: z.string(),
    contact_person: z.string().optional(),
    rental_cost: z.coerce.number().min(0).optional(),
    address: z.string(),
    capacity: z.coerce.number().min(0),
    accessibility_info: z.string().optional(),
    description: z.string().optional(),
});

export const LocationUpdateSchema = LocationCreateSchema.partial();

// =============================================================================
// EVENT SCHEMAS
// =============================================================================

export const EventCreateSchema = z
    .object({
        id: z.string().optional(),
        title: z.string(),
        location_id: z.string().nullable().optional(),
        start_time: stringToISODate,
        end_time: stringToISODate,
        description: z.string().optional(),
        max_participants: z.coerce.number().int().positive(),
        tags: selectMultipleSchema.optional(),
    })
    .omit({
        id: true,
    });

export const EventUpdateSchema = EventCreateSchema.partial().extend({
    status: EventStatusSchema.optional(),
});

// =============================================================================
// PARTICIPANT IN EVENT SCHEMAS
// =============================================================================

// Event participants are never created from forms and thus don't need validation

// =============================================================================
// RESERVE IN EVENT SCHEMAS
// =============================================================================

// Event reserves are never created from forms and thus don't need validation

// =============================================================================
// SKILL BADGE SCHEMAS
// =============================================================================

export const SkillBadgeCreateSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    image_url: z.string().optional(),
});

// =============================================================================
// TASK SCHEMAS
// =============================================================================

export const TaskCreateSchema = z
    .object({
        id: z.string().optional(),
        name: z.string(),
        status: TaskStatusSchema.optional(),
        start_time: stringToISODate.optional(),
        end_time: stringToISODate,
        description: z.string(),
        tags: selectMultipleSchema,

        assignee_id: z.string().nullable(),
        reviewer_id: z.string(),

        skill_badges: selectMultipleSchema,

        event_id: z.uuid().nullable().optional(),
    })
    .omit({ id: true });

export const TaskUpdateSchema = TaskCreateSchema.partial();

// =============================================================================
// PRODUCT SCHEMAS
// =============================================================================

export const ProductCreateSchema = z
    .object({
        id: z.string().optional(),
        name: z.string(),
        description: z.string().optional(),
        price: priceSchema.optional(),
        vat_percentage: z.coerce.number().min(0).max(100),
        stock: z.coerce.number().int().nonnegative().nullable().optional(),
        unlimited_stock: z.coerce.boolean().optional(),
        image_url: z.string().optional(),
    })
    .omit({ id: true });

export const ProductUpdateSchema = ProductCreateSchema;

// =============================================================================
// MEMBERSHIP SCHEMAS
// =============================================================================

export const MembershipWithoutProductSchema = z.object({
    duration: z.coerce.number().int().positive(), // days
});

export const MembershipCreateSchema = z.intersection(
    MembershipWithoutProductSchema,
    ProductCreateSchema,
);

export const MembershipUpdateSchema = z.intersection(
    MembershipWithoutProductSchema,
    ProductUpdateSchema,
);

// =============================================================================
// USER MEMBERSHIP SCHEMAS
// =============================================================================

// User memberships are never created from forms and thus don't need validation

// =============================================================================
// TICKET SCHEMAS
// =============================================================================

// Extract only the common properties from the three Prisma ticket types
type CommonTicketKeys = keyof Prisma.TicketCreateWithoutEventInput &
    keyof Prisma.TicketCreateWithoutProductInput &
    keyof Prisma.TicketCreateWithoutEvent_participantsInput;

export type TicketWithoutRelations = Pick<Prisma.TicketCreateWithoutEventInput, CommonTicketKeys>;

export const TicketWithoutRelationsSchema: z.ZodType<TicketWithoutRelations> = z
    .object({
        id: z.string().optional(),
        type: TicketTypeSchema,

        product: ProductCreateSchema.optional(),
        event: EventCreateSchema.optional(),
    })
    .omit({ id: true });

export const TicketCreateSchema = z.intersection(TicketWithoutRelationsSchema, ProductCreateSchema);

export const TicketUpdateSchema = z.intersection(TicketWithoutRelationsSchema, ProductUpdateSchema);

// =============================================================================
// ORDER SCHEMAS
// =============================================================================

// Orders are never created from forms and thus don't need validation

export const OrderUpdateSchema = z.object({
    status: OrderStatusSchema,
});

// =============================================================================
// ORDER ITEM SCHEMAS
// =============================================================================

// Order items are never created from forms and thus don't need validation

// =============================================================================
// TEXT CONTENT SCHEMAS
// =============================================================================

export const TextContentCreateSchema = z.object({
    id: z.string(),
    language: z.string(),
    content: z.string(),
    category: z.string().nullable(),
});

export const TextContentUpdateSchema = TextContentCreateSchema.partial().extend({
    id: z.string(),
    language: z.string(), // Required (part of composite key)
});

// =============================================================================
// CUSTOM SCHEMAS
// =============================================================================

export const MembershipApplicationSchema = UserCreateSchema.extend({
    member_application_prompt: z.string().optional(),
});

export const LoginSchema = z.object({
    email: z.email().toLowerCase(),
});

export const UpdateTextContentSchema = z.object({ text: z.string() });

export const EmailSendoutSchema = z.object({
    subject: z.string(),
    content: z.string(),
});

export const AddEventParticipantSchema = z.object({
    user_id: z.uuid(),
    ticket_id: z.uuid(),
});

export const AddEventReserveSchema = z.object({
    user_id: z.uuid(),
});

export const TaskFilterSchema = z
    .object({
        unassigned: switchButtonSchema,
        assigned_to_me: switchButtonSchema,
        for_me_to_review: switchButtonSchema,
        begins_after: stringToISODate,
        ends_before: stringToISODate,
        has_tag: selectMultipleSchema,
        status: selectMultipleSchema,
    })
    .partial();

export const CloneEventSchema = z.object({
    start_time: stringToISODate,
});

export const AddMembershipSchema = z.object({
    expires_at: stringToISODate,
});

export const ContactMemberSchema = z.object({
    content: z.string().min(2).max(1000),
});

// Export UUID schema for ID validation
export const UuidSchema = uuidSchema;
