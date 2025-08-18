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

export const OrganizationSettingsCreateSchema = z.object({
    remindMembershipExpiresInDays: z.number().int().positive().default(7),
    organizationName: z.string().default("Task Master"),
    purgeMembersAfterDaysUnvalidated: z.number().int().positive().default(180),
    email: z.string().email().default("kellensmith407@gmail.com"),
});

export const OrganizationSettingsUpdateSchema: z.ZodType<Prisma.OrganizationSettingsUpdateInput> =
    OrganizationSettingsCreateSchema.partial();

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const UserCreateSchema = z.object({
    id: z.string().uuid().optional(),
    firstName: z.string().default(""),
    surName: z.string().default(""),
    nickname: z.string().uuid().optional(),
    pronoun: z.string().nullable().default("they/them"),
    email: z.string().email(),
    phone: z.string().nullable().default(""),
    createdAt: z.date().optional(),
    consentToNewsletters: z.boolean().default(true),
    role: UserRoleSchema.default(UserRole.user),
});

export const UserUpdateSchema = UserCreateSchema.partial().extend({
    id: z.string().uuid(), // Required for updates
});

// =============================================================================
// USER CREDENTIALS SCHEMAS
// =============================================================================

export const UserCredentialsCreateSchema = z.object({
    id: z.string().uuid().optional(),
    email: z.string().email(),
    salt: z.string(),
    hashedPassword: z.string(),
});

export const UserCredentialsUpdateSchema = UserCredentialsCreateSchema.partial().extend({
    id: z.string().uuid(), // Required for updates
});

// =============================================================================
// EVENT SCHEMAS
// =============================================================================

export const EventCreateSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().default(""),
    location: z.string().default(""),
    startTime: z.date(),
    endTime: z.date(),
    description: z.string().default(""),
    maxParticipants: z.number().int().positive().nullable(),
    fullTicketPrice: z.number().int().nonnegative().default(0),
    status: EventStatusSchema.default(EventStatus.draft),
    hostId: z.string().uuid(),
});

export const EventUpdateSchema = EventCreateSchema.partial().extend({
    id: z.string().uuid(), // Required for updates
});

// =============================================================================
// PARTICIPANT IN EVENT SCHEMAS
// =============================================================================

export const ParticipantInEventCreateSchema = z.object({
    userId: z.string().uuid(),
    eventId: z.string().uuid(),
    ticketId: z.string().uuid(),
});

export const ParticipantInEventUpdateSchema = ParticipantInEventCreateSchema;

// =============================================================================
// RESERVE IN EVENT SCHEMAS
// =============================================================================

export const ReserveInEventCreateSchema = z.object({
    userId: z.string().uuid(),
    eventId: z.string().uuid(),
    queueingSince: z.date().default(() => new Date()),
});

export const ReserveInEventUpdateSchema = ReserveInEventCreateSchema;

// =============================================================================
// TASK SCHEMAS
// =============================================================================

export const TaskCreateSchema = z.object({
    id: z.string().uuid().optional(),
    eventId: z.string().uuid().nullable(),
    assigneeId: z.string().uuid().nullable(),
    reporterId: z.string().uuid().nullable(),
    phase: TaskPhaseSchema.default(TaskPhase.before),
    name: z.string().default(""),
    status: TaskStatusSchema.default(TaskStatus.toDo),
    tags: z.array(z.string()).default([]),
    startTime: z.date().nullable(),
    endTime: z.date().nullable(),
    description: z.string().default(""),
});

export const TaskUpdateSchema = TaskCreateSchema.partial().extend({
    id: z.string().uuid(), // Required for updates
});

// =============================================================================
// PRODUCT SCHEMAS
// =============================================================================

export const ProductCreateSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().default(""),
    description: z.string().default(""),
    price: z.number().nonnegative().default(0),
    stock: z.number().int().nonnegative().nullable().default(0),
    unlimitedStock: z.boolean().default(false),
    imageUrl: z.string().url().default(""),
});

export const ProductUpdateSchema = ProductCreateSchema.partial().extend({
    id: z.string().uuid(), // Required for updates
});

// =============================================================================
// MEMBERSHIP SCHEMAS
// =============================================================================

export const MembershipCreateSchema = z.object({
    id: z.string().uuid().optional(),
    productId: z.string().uuid(),
    duration: z.number().int().positive().default(365), // days
});

export const MembershipUpdateSchema = MembershipCreateSchema.partial().extend({
    id: z.string().uuid(), // Required for updates
});

// =============================================================================
// USER MEMBERSHIP SCHEMAS
// =============================================================================

export const UserMembershipCreateSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid(),
    membershipId: z.string().uuid(),
    expiresAt: z.date(),
});

export const UserMembershipUpdateSchema = UserMembershipCreateSchema.partial().extend({
    id: z.string().uuid(), // Required for updates
});

// =============================================================================
// TICKET SCHEMAS
// =============================================================================

export const TicketCreateSchema = z.object({
    id: z.string().uuid().optional(),
    type: TicketTypeSchema.default(TicketType.standard),
    productId: z.string().uuid(),
    eventId: z.string().uuid(),
});

export const TicketUpdateSchema = TicketCreateSchema.partial().extend({
    id: z.string().uuid(), // Required for updates
});

// =============================================================================
// ORDER SCHEMAS
// =============================================================================

export const OrderCreateSchema = z.object({
    id: z.string().uuid().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    status: OrderStatusSchema.default(OrderStatus.pending),
    totalAmount: z.number().nonnegative().default(0.0),
    paymentRequestId: z.string().nullable(),
    payeeRef: z.string().nullable(),
    userId: z.string().uuid(),
});

export const OrderUpdateSchema = OrderCreateSchema.partial().extend({
    id: z.string().uuid(), // Required for updates
});

// =============================================================================
// ORDER ITEM SCHEMAS
// =============================================================================

export const OrderItemCreateSchema = z.object({
    id: z.string().uuid().optional(),
    quantity: z.number().int().positive().default(1),
    price: z.number().nonnegative().default(0),
    orderId: z.string().uuid(),
    productId: z.string().uuid(),
});

export const OrderItemUpdateSchema = OrderItemCreateSchema.partial().extend({
    id: z.string().uuid(), // Required for updates
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
    id: z.string(), // Required for updates
    language: z.string(), // Required for updates (part of composite key)
});

// =============================================================================
// CUSTOM SCHEMAS
// =============================================================================

export const LoginSchema = z.object({
    email: z.email(),
    password: z.string().min(6).max(100),
});
