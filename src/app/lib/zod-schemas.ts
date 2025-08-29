import { z } from "zod";
import { UserRole, EventStatus, TaskStatus, TicketType, OrderStatus, Prisma } from "@prisma/client";
import dayjs from "dayjs";

// Required dayjs to string schema for create operations
const stringToISODate = z
    .string()
    .refine((val) => dayjs(val, "DD/MM/YYYY HH:mm").isValid(), {
        message: "Invalid date",
    })
    .transform((val) => dayjs(val, "DD/MM/YYYY HH:mm").toISOString()) as z.ZodType<string>;

const passwordSchema = z.string().min(6).max(100);

const priceSchema = z.coerce
    .number()
    .nonnegative()
    .transform((val) => Math.round(val * 100));

const selectMultipleSchema = z
    .string()
    .transform((val) => (val ? val.split(",") : []))
    .optional();

// TODO: Implement swedish translations for error messages

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
        organization_name: z.string().optional(),
        organization_email: z.string().email().optional(),
        remind_membership_expires_in_days: z.coerce.number().int().positive().optional(),
        purge_members_after_days_unvalidated: z.coerce.number().int().positive().optional(),
        default_task_shift_length: z.coerce.number().int().positive().optional(),
        member_application_prompt: z.string().optional(),
    })
    .omit({ id: true });

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const UserCreateSchema = z
    .object({
        id: z.string().optional(),
        email: z.email(),
        nickname: z.string().optional(),
        role: UserRoleSchema.optional(),
        consentToNewsletters: z.coerce.boolean().optional(),

        first_name: z.string().optional(),
        sur_name: z.string().optional(),
        pronoun: z.string().optional(),
        phone: z.string().optional(),

        member_application_prompt: z.string().optional(),

        skill_badges: selectMultipleSchema,
    })
    .omit({ member_application_prompt: true });

export const UserUpdateSchema = UserCreateSchema.partial();

// =============================================================================
// USER CREDENTIALS SCHEMAS
// =============================================================================

// UserCredentials are never created from forms and thus don't need validation

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
        start_time: stringToISODate,
        end_time: stringToISODate,
        description: z.string(),
        tags: selectMultipleSchema,

        assignee_id: z.string().nullable(),
        reviewer_id: z.string().nullable(),

        skill_badges: selectMultipleSchema,

        event_id: z.string().nullable().optional(),
    })
    .omit({ id: true, event_id: true });

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
        stock: z.coerce.number().int().nonnegative().nullable().optional(),
        unlimited_stock: z.coerce.boolean().optional(),
        image_url: z.string().optional(),
    })
    .omit({ id: true });

export const ProductUpdateSchema = ProductCreateSchema;

// =============================================================================
// MEMBERSHIP SCHEMAS
// =============================================================================

export const MembershipWithoutProductSchema = z
    .object({
        id: z.string().optional(),
        duration: z.number().int().positive(), // days
    })
    .omit({ id: true });

export const MembershipCreateSchema = z.union([
    MembershipWithoutProductSchema,
    ProductCreateSchema,
]);

export const MembershipUpdateSchema = z.union([
    MembershipWithoutProductSchema,
    ProductUpdateSchema,
]);

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

export const TicketCreateSchema = z.union([TicketWithoutRelationsSchema, ProductCreateSchema]);

export const TicketUpdateSchema = z.union([TicketWithoutRelationsSchema, ProductUpdateSchema]);

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

export const MembershipApplicationSchema = UserCreateSchema.partial().extend({
    memberApplicationPrompt: z.string().optional(),
});

export const LoginSchema = z.object({
    email: z.email(),
    password: z.string(),
});

export const ResetCredentialsSchema = z.object({
    email: z.email(),
});

export const UpdateTextContentSchema = z.object({ text: z.string() });

export const UpdateCredentialsSchema = z.object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    repeatPassword: passwordSchema,
});

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
