import { z } from "zod";
import {
    UserRole,
    EventStatus,
    TaskStatus,
    TaskPhase,
    TicketType,
    OrderStatus,
    Prisma,
} from "@prisma/client";
import dayjs from "dayjs";

// Required dayjs to string schema for create operations
const stringToISODate = z
    .string()
    .refine((val) => dayjs(val, "DD/MM/YYYY HH:mm").isValid(), {
        message: "Invalid date",
    })
    .transform((val) => dayjs(val, "DD/MM/YYYY HH:mm").toISOString()) as z.ZodType<string>;

const passwordSchema = z.string().min(6).max(100);

// =============================================================================
// ENUM SCHEMAS - Derived from Prisma enums
// =============================================================================

export const UserRoleSchema = z.enum(UserRole);
export const EventStatusSchema = z.enum(EventStatus);
export const TaskStatusSchema = z.enum(TaskStatus);
export const TaskPhaseSchema = z.enum(TaskPhase);
export const TicketTypeSchema = z.enum(TicketType);
export const OrderStatusSchema = z.enum(OrderStatus);

// =============================================================================
// ORGANIZATION SETTINGS SCHEMAS
// =============================================================================

export const OrganizationSettingsCreateSchema = z
    .object({
        id: z.string().optional(),
        remindMembershipExpiresInDays: z.coerce.number().int().positive().default(7),
        organizationName: z.string().default("Task Master"),
        purgeMembersAfterDaysUnvalidated: z.coerce.number().int().positive().default(180),
        email: z.email().default("kellensmith407@gmail.com"),
    })
    .omit({ id: true });

export const OrganizationSettingsUpdateSchema: z.ZodType<Prisma.OrganizationSettingsUpdateInput> =
    OrganizationSettingsCreateSchema.partial().extend({
        id: z.string().optional(),
    });

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const UserCreateSchema = z
    .object({
        id: z.string().optional(),
        firstName: z.string().default(""),
        surName: z.string().default(""),
        nickname: z.string().optional(),
        pronoun: z.string().nullable().default("they/them"),
        email: z.email(),
        phone: z.string().nullable().default(""),
        consentToNewsletters: z.coerce.boolean(),
        role: UserRoleSchema.default(UserRole.member),
    })
    .omit({ id: true });

export const UserUpdateSchema = UserCreateSchema.partial().extend({
    id: z.string().optional(),
});

// =============================================================================
// USER CREDENTIALS SCHEMAS
// =============================================================================

export const UserCredentialsCreateSchema = z
    .object({
        id: z.string().optional(),
        email: z.email(),
        salt: z.string(),
        hashedPassword: z.string(),
    })
    .omit({ id: true });

export const UserCredentialsUpdateSchema = UserCredentialsCreateSchema.partial().extend({
    id: z.string().optional(),
});

// =============================================================================
// EVENT SCHEMAS
// =============================================================================

export const EventCreateSchema = z
    .object({
        id: z.string().optional(),
        title: z.string().default(""),
        location: z.string().default(""),
        startTime: stringToISODate,
        endTime: stringToISODate,
        description: z.string().default(""),
        maxParticipants: z.coerce.number().int().positive().nullable(),
        status: EventStatusSchema.default(EventStatus.draft),
    })
    .omit({ id: true });

export const EventUpdateSchema = EventCreateSchema.partial().extend({
    id: z.string().optional(),
});

// =============================================================================
// PARTICIPANT IN EVENT SCHEMAS
// =============================================================================

export const ParticipantInEventCreateSchema = z.object({
    userId: z.string(),
    eventId: z.string(),
    ticketId: z.string(),
});

export const ParticipantInEventUpdateSchema = ParticipantInEventCreateSchema;

// =============================================================================
// RESERVE IN EVENT SCHEMAS
// =============================================================================

export const ReserveInEventCreateSchema = z.object({
    userId: z.string(),
    eventId: z.string(),
    queueingSince: stringToISODate.default(dayjs().toISOString()),
});

export const ReserveInEventUpdateSchema = ReserveInEventCreateSchema;

// =============================================================================
// TASK SCHEMAS
// =============================================================================

export const TaskCreateSchema = z
    .object({
        id: z.string().optional(),
        phase: TaskPhaseSchema.default(TaskPhase.before),
        name: z.string().default(""),
        status: TaskStatusSchema.default(TaskStatus.toDo),
        eventId: z.string().nullable().optional(),
        assigneeId: z.string().nullable(),
        reviewerId: z.string().nullable(),
        tags: z
            .string()
            .transform((val) => (val ? val.split(",") : []))
            .default([]),
        startTime: stringToISODate.nullable(),
        endTime: stringToISODate.nullable(),
        description: z.string().default(""),
    })
    .omit({ id: true });

export const TaskUpdateSchema = TaskCreateSchema.partial();

// =============================================================================
// PRODUCT SCHEMAS
// =============================================================================

export const ProductCreateSchema = z
    .object({
        id: z.string().optional(),
        name: z.string().default(""),
        description: z.string().default(""),
        price: z.coerce
            .number()
            .nonnegative()
            .default(0)
            .transform((val) => Math.round(val * 100)),
        stock: z.coerce.number().int().nonnegative().nullable().default(0),
        unlimitedStock: z.coerce.boolean().default(false),
        imageUrl: z.string().optional(),
    })
    .omit({ id: true });

export const ProductUpdateSchema = ProductCreateSchema.partial().extend({
    id: z.string().optional(),
});

// =============================================================================
// MEMBERSHIP SCHEMAS
// =============================================================================

export const MembershipCreateSchema = z.object({
    id: z.string().optional(),
    productId: z.string(),
    duration: z.number().int().positive().default(365), // days
});

export const MembershipUpdateSchema = MembershipCreateSchema.partial().extend({
    id: z.string().optional(),
});

// =============================================================================
// USER MEMBERSHIP SCHEMAS
// =============================================================================

export const UserMembershipWithoutProductSchema = z.object({ expiresAt: stringToISODate });

export const UserMembershipCreateSchema = z.union([
    UserMembershipWithoutProductSchema,
    ProductCreateSchema,
]);

export const UserMembershipUpdateSchema = UserMembershipCreateSchema;

// =============================================================================
// TICKET SCHEMAS
// =============================================================================

export const TicketWithoutProductSchema = z.object({
    id: z.string().optional(),
    type: TicketTypeSchema.default(TicketType.standard),
});

export const TicketCreateSchema = z.union([
    TicketWithoutProductSchema,
    ProductCreateSchema.omit({ stock: true, unlimitedStock: true }),
]);

export const TicketUpdateSchema = TicketCreateSchema;

// =============================================================================
// ORDER SCHEMAS
// =============================================================================

export const OrderCreateSchema = z
    .object({
        id: z.string().optional(),
        status: OrderStatusSchema.default(OrderStatus.pending),
        totalAmount: z.number().nonnegative().default(0.0),
        paymentRequestId: z.string().nullable(),
        payeeRef: z.string().nullable(),
        userId: z.string(),
    })
    .omit({ id: true });

export const OrderUpdateSchema = OrderCreateSchema.partial().extend({
    id: z.string().optional(),
});

// =============================================================================
// ORDER ITEM SCHEMAS
// =============================================================================

export const OrderItemCreateSchema = z.object({
    id: z.string().optional(),
    quantity: z.number().int().positive().default(1),
    price: z.number().nonnegative().default(0),
    orderId: z.string(),
    productId: z.string(),
});

export const OrderItemUpdateSchema = OrderItemCreateSchema.partial().extend({
    id: z.string().optional(),
});

// =============================================================================
// TEXT CONTENT SCHEMAS
// =============================================================================

export const TextContentCreateSchema = z.object({
    id: z.string(),
    language: z.string(),
    content: z.string(),
    category: z.string().nullable().default("organization"),
});

export const TextContentUpdateSchema = TextContentCreateSchema.partial().extend({
    id: z.string(),
    language: z.string(), // Required (part of composite key)
});

// =============================================================================
// CUSTOM SCHEMAS
// =============================================================================

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
