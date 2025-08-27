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
        organizationName: z.string().optional(),
        organizationEmail: z.email().optional(),
        remindMembershipExpiresInDays: z.coerce.number().int().positive().optional(),
        purgeMembersAfterDaysUnvalidated: z.coerce.number().int().positive().optional(),
        defaultTaskShiftLength: z.coerce.number().int().positive().optional(),
        memberApplicationPrompt: z.string().optional(),
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

        firstName: z.string().optional(),
        surName: z.string().optional(),
        pronoun: z.string().optional(),
        phone: z.string().optional(),

        memberApplicationPrompt: z.string().optional(),
    })
    .omit({ memberApplicationPrompt: true });

export const UserUpdateSchema: z.ZodType<Prisma.UserUpdateInput> = UserCreateSchema;

// =============================================================================
// USER CREDENTIALS SCHEMAS
// =============================================================================

// UserCredentials are never created from forms and thus don't need validation

// =============================================================================
// LOCATION SCHEMAS
// =============================================================================

export const LocationCreateSchema = z.object({
    name: z.string(),
    contactPerson: z.string().optional(),
    rentalCost: z.coerce.number().min(0).optional(),
    address: z.string(),
    capacity: z.coerce.number().min(0),
    accessibilityInfo: z.string().optional(),
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
        locationId: z.string().nullable().optional(),
        startTime: stringToISODate,
        endTime: stringToISODate,
        description: z.string().optional(),
        maxParticipants: z.coerce.number().int().positive(),
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
// TASK SCHEMAS
// =============================================================================

export const TaskCreateSchema: z.ZodType<
    Prisma.TaskCreateInput & { assigneeId?: string; reviewerId?: string }
> = z
    .object({
        id: z.string().optional(),
        name: z.string(),
        status: TaskStatusSchema.optional(),
        startTime: stringToISODate,
        endTime: stringToISODate,
        description: z.string(),
        tags: z
            .string()
            .transform((val) => (val ? val.split(",") : []))
            .optional(),

        assigneeId: z.string().nullable(),
        reviewerId: z.string().nullable(),

        eventId: z.string().nullable().optional(),
    })
    .omit({ id: true, eventId: true });

export const TaskUpdateSchema: z.ZodType<
    Prisma.TaskUpdateInput & { assigneeId?: string; reviewerId?: string }
> = TaskCreateSchema;

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
        unlimitedStock: z.coerce.boolean().optional(),
        imageUrl: z.string().optional(),
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
    keyof Prisma.TicketCreateWithoutEventParticipantsInput;

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

export const UpdateTextContentSchema = z.object({ content: z.string() });

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
    userId: z.uuid(),
    ticketId: z.uuid(),
});

export const AddEventReserveSchema = z.object({
    userId: z.uuid(),
});
