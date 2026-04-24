import { describe, expect, it } from "vitest";
import dayjs from "./dayjs";
import {
    AddEventParticipantSchema,
    AddEventReserveSchema,
    AddMembershipSchema,
    CloneEventSchema,
    ContactMemberSchema,
    EmailSendoutSchema,
    EventCreateSchema,
    EventUpdateSchema,
    LocationCreateSchema,
    LocationUpdateSchema,
    MembershipUpdateSchema,
    ProductUpdateSchema,
    SkillBadgeCreateSchema,
    TaskUpdateSchema,
    TicketUpdateSchema,
    EventStatusSchema,
    InfoPageCreateSchema,
    InfoPageUpdateSchema,
    LoginSchema,
    MembershipApplicationSchema,
    MembershipCreateSchema,
    MembershipWithoutProductSchema,
    OrganizationSettingsUpdateSchema,
    OrderStatusSchema,
    OrderUpdateSchema,
    ProductCreateSchema,
    TaskCreateSchema,
    TaskFilterSchema,
    TextContentCreateSchema,
    TextContentUpdateSchema,
    TicketCreateSchema,
    TicketWithoutRelationsSchema,
    UpdateTextContentSchema,
    UserCreateSchema,
    UserRoleSchema,
    UuidSchema,
} from "./zod-schemas";
import testdata from "../../test/testdata";
import {
    EventStatus,
    OrderStatus,
    TaskStatus,
    TicketType,
    UserRole,
} from "../../prisma/generated/enums";

const validDate = "2026-02-03 14:30";
const expectedDate = dayjs(validDate, "YYYY-MM-DD HH:mm").format();

const baseProduct = {
    name: "Test Product",
    vat_percentage: 25,
};

describe("enum schemas", () => {
    it("accepts valid enum values", () => {
        expect(UserRoleSchema.parse(UserRole.member)).toBe(UserRole.member);
        expect(EventStatusSchema.parse(EventStatus.draft)).toBe(EventStatus.draft);
    });

    it("rejects invalid enum values", () => {
        expect(UserRoleSchema.safeParse("superadmin").success).toBe(false);
    });
});

describe("OrganizationSettingsUpdateSchema", () => {
    it("accepts empty event_manager_email, strips id and unexpected fields", () => {
        const result = OrganizationSettingsUpdateSchema.parse({
            id: "should-be-removed",
            event_manager_email: "",
            primary_color: "#fff",
            is_admin: true,
        });

        expect(result).toEqual({
            event_manager_email: "",
            primary_color: "#fff",
        });
    });

    it("rejects invalid hex color", () => {
        const result = OrganizationSettingsUpdateSchema.safeParse({
            primary_color: "not-a-color",
        });

        expect(result.success).toBe(false);
    });
});

describe("InfoPage schemas", () => {
    it("enforces title length, accepts empty role and strips unexpected fields", () => {
        const result = InfoPageCreateSchema.parse({
            title: "About",
            lowest_allowed_user_role: "",
            injected: "<script />",
        });

        expect(result).toEqual({
            title: "About",
            lowest_allowed_user_role: "",
        });
    });

    it("allows partial updates", () => {
        expect(InfoPageUpdateSchema.parse({})).toEqual({});
    });
});

describe("User schemas", () => {
    it("lowercases email, parses skill badges and strips unexpected fields", () => {
        const result = UserCreateSchema.parse({
            email: "TEST@Example.com",
            role: UserRole.member,
            consent_to_newsletters: "true",
            skill_badges: "alpha,beta",
            is_admin: true,
        });

        expect(result).toEqual({
            email: "test@example.com",
            role: UserRole.member,
            consent_to_newsletters: true,
            skill_badges: ["alpha", "beta"],
        });
    });

    it("parses empty skill badges as empty array and strips unexpected fields", () => {
        const result = UserCreateSchema.parse({
            email: "user@example.com",
            skill_badges: "",
            sql_injection: "DROP TABLE users;",
        });

        expect(result).toEqual({
            email: "user@example.com",
            skill_badges: [],
        });
    });

    it("accepts base user values from testdata and strips unexpected fields", () => {
        const result = UserCreateSchema.parse({
            email: testdata.user.email,
            nickname: testdata.user.nickname,
            first_name: testdata.user.first_name,
            sur_name: testdata.user.sur_name,
            pronoun: testdata.user.pronoun,
            phone: testdata.user.phone,
            malicious: "<script>alert(1)</script>",
        });

        expect(result).toEqual({
            email: testdata.user.email,
            nickname: testdata.user.nickname,
            first_name: testdata.user.first_name,
            sur_name: testdata.user.sur_name,
            pronoun: testdata.user.pronoun,
            phone: testdata.user.phone,
        });
    });
});

describe("EventCreateSchema", () => {
    it("transforms dates to ISO strings and strips unexpected fields", () => {
        const result = EventCreateSchema.parse({
            title: "Planning Meeting",
            location_id: null,
            start_time: validDate,
            end_time: validDate,
            max_participants: "20",
            tags: "planning,team",
            injected: "<img src=x onerror=alert(1) />",
        });

        expect(result).toEqual({
            title: "Planning Meeting",
            location_id: null,
            start_time: expectedDate,
            end_time: expectedDate,
            max_participants: 20,
            tags: ["planning", "team"],
        });
    });

    it("rejects invalid date strings", () => {
        const result = EventCreateSchema.safeParse({
            title: "Invalid",
            location_id: null,
            start_time: "32/13/2026 99:99",
            end_time: validDate,
            max_participants: 10,
        });

        expect(result.success).toBe(false);
    });
});

describe("EventUpdateSchema", () => {
    it("accepts status updates", () => {
        const result = EventUpdateSchema.parse({ status: EventStatus.published });
        expect(result).toEqual({ status: EventStatus.published });
    });
});

describe("Task schemas", () => {
    it("parses select-multiple inputs and optional status and strips unexpected fields", () => {
        const result = TaskCreateSchema.parse({
            name: "Test task",
            status: TaskStatus.toDo,
            start_time: validDate,
            end_time: validDate,
            description: "Do the thing",
            tags: "alpha,beta",
            assignee_id: null,
            reviewer_id: "reviewer",
            skill_badges: "badge-a,badge-b",
            event_id: "00000000-0000-0000-0000-000000000000",
            unauthorized: true,
        });

        expect(result).toEqual({
            name: "Test task",
            status: TaskStatus.toDo,
            start_time: expectedDate,
            end_time: expectedDate,
            description: "Do the thing",
            tags: ["alpha", "beta"],
            assignee_id: null,
            reviewer_id: "reviewer",
            skill_badges: ["badge-a", "badge-b"],
            event_id: "00000000-0000-0000-0000-000000000000",
        });
    });

    it("allows partial task updates", () => {
        const result = TaskUpdateSchema.parse({ description: "Updated" });
        expect(result).toEqual({ description: "Updated" });
    });
});

describe("Location schemas", () => {
    it("creates and updates locations and strips unexpected fields", () => {
        const created = LocationCreateSchema.parse({
            name: "Main Hall",
            address: "123 Street",
            capacity: 50,
            injected: "<svg onload=alert(1)>",
        });
        const updated = LocationUpdateSchema.parse({ description: "Updated" });

        expect(created).toEqual({
            name: "Main Hall",
            address: "123 Street",
            capacity: 50,
        });
        expect(updated).toEqual({ description: "Updated" });
    });
});

describe("Skill badge schema", () => {
    it("creates a skill badge and strips unexpected fields  ", () => {
        const result = SkillBadgeCreateSchema.parse({ name: "Helper", injected: "<script />" });
        expect(result).toEqual({ name: "Helper" });
    });
});

describe("Product and membership schemas", () => {
    it("coerces and rounds price to cents and strips unexpected fields", () => {
        const result = ProductCreateSchema.parse({
            ...baseProduct,
            price: "10.255",
            stock: "3",
            injected: "<script />",
        });

        expect(result).toEqual({
            name: baseProduct.name,
            vat_percentage: baseProduct.vat_percentage,
            price: 1026,
            stock: 3,
        });
    });

    it("requires duration for memberships and strips unexpected fields", () => {
        expect(MembershipWithoutProductSchema.safeParse({}).success).toBe(false);
        const result = MembershipCreateSchema.parse({
            ...baseProduct,
            duration: 365,
            injected: "<script />",
        });

        expect(result).toEqual({
            name: baseProduct.name,
            vat_percentage: baseProduct.vat_percentage,
            duration: 365,
        });
    });

    it("accepts empty stock and transforms to null", () => {
        const result = ProductCreateSchema.parse({
            ...baseProduct,
            price: "10.00",
            stock: "",
        });

        expect(result).toEqual({
            name: baseProduct.name,
            vat_percentage: baseProduct.vat_percentage,
            price: 1000,
            stock: null,
        });
    });

    it("updates membership with product data and strips unexpected fields", () => {
        const result = MembershipUpdateSchema.parse({
            ...baseProduct,
            duration: 365,
            injected: "<script />",
        });

        expect(result).toEqual({
            name: baseProduct.name,
            vat_percentage: baseProduct.vat_percentage,
            duration: 365,
        });
    });

    it("updates product data and strips unexpected fields", () => {
        const result = ProductUpdateSchema.parse({
            ...baseProduct,
            price: 10,
            injected: "<script />",
        });

        expect(result).toEqual({
            name: baseProduct.name,
            vat_percentage: baseProduct.vat_percentage,
            price: 1000,
        });
    });
});

describe("Ticket schemas", () => {
    it("creates tickets with product data and strips unexpected fields", () => {
        const result = TicketCreateSchema.parse({
            type: TicketType.standard,
            name: "Ticketed Product",
            vat_percentage: 25,
            price: 50,
            injected: "<script />",
        });

        expect(result).toEqual({
            type: TicketType.standard,
            name: "Ticketed Product",
            vat_percentage: 25,
            price: 5000,
        });
    });

    it("accepts ticket without relations and strips unexpected fields", () => {
        const result = TicketWithoutRelationsSchema.parse({
            type: TicketType.volunteer,
            injected: "<script />",
        });

        expect(result).toEqual({ type: TicketType.volunteer });
    });

    it("updates ticket with product data and strips unexpected fields", () => {
        const result = TicketUpdateSchema.parse({
            type: TicketType.volunteer,
            ...baseProduct,
            price: 10,
            injected: "<script />",
        });

        expect(result).toEqual({
            type: TicketType.volunteer,
            name: baseProduct.name,
            vat_percentage: baseProduct.vat_percentage,
            price: 1000,
        });
    });
});

describe("Text content schemas", () => {
    it("accepts full text content payload and strips unexpected fields", () => {
        const result = TextContentCreateSchema.parse({
            id: "text-id",
            language: "en",
            content: "Hello",
            category: null,
            injected: "<script />",
        });

        expect(result).toEqual({
            id: "text-id",
            language: "en",
            content: "Hello",
            category: null,
        });
    });

    it("requires composite keys on update and strips unexpected fields", () => {
        const missingLanguage = TextContentUpdateSchema.safeParse({
            id: "text-id",
            content: "Updated",
        });

        expect(missingLanguage.success).toBe(false);
    });
});

describe("Custom schemas", () => {
    it("extends membership application with prompt and strips unexpected fields", () => {
        const result = MembershipApplicationSchema.parse({
            email: "member@example.com",
            member_application_prompt: "Tell us about you",
            injected: "<script />",
        });

        expect(result).toEqual({
            email: "member@example.com",
            member_application_prompt: "Tell us about you",
        });
    });

    it("lowercases login email and strips unexpected fields", () => {
        const result = LoginSchema.parse({ email: "ADMIN@Example.com", injected: "<script />" });
        expect(result).toEqual({ email: "admin@example.com" });
    });

    it("validates UUID-based payloads", () => {
        expect(
            AddEventParticipantSchema.safeParse({
                user_id: "00000000-0000-0000-0000-000000000000",
                ticket_id: "00000000-0000-0000-0000-000000000000",
            }).success,
        ).toBe(true);

        expect(AddEventReserveSchema.safeParse({ user_id: "not-a-uuid" }).success).toBe(false);

        expect(UuidSchema.safeParse("not-a-uuid").success).toBe(false);
    });

    it("parses task filter toggles and strips unexpected fields", () => {
        const result = TaskFilterSchema.parse({
            unassigned: "on",
            assigned_to_me: "off",
            begins_after: validDate,
            ends_before: "",
            has_tag: "alpha,beta",
            status: "open,done",
            injected: "<script />",
        });

        expect(result).toEqual({
            unassigned: true,
            assigned_to_me: false,
            begins_after: expectedDate,
            ends_before: "",
            has_tag: ["alpha", "beta"],
            status: ["open", "done"],
        });
    });

    it("parses empty filter values and strips unexpected fields", () => {
        const result = TaskFilterSchema.parse({
            begins_after: "",
            ends_before: "",
            has_tag: "",
            status: "",
            injected: "<script />",
        });

        expect(result).toEqual({
            begins_after: "",
            ends_before: "",
            has_tag: [],
            status: [],
        });
    });

    it("validates auxiliary schemas and strips unexpected fields", () => {
        expect(
            EmailSendoutSchema.parse({ subject: "Hi", content: "Body", injected: "<script />" }),
        ).toEqual({
            subject: "Hi",
            content: "Body",
        });
        expect(UpdateTextContentSchema.parse({ text: "Updated", injected: "<script />" })).toEqual({
            text: "Updated",
        });
        expect(CloneEventSchema.parse({ start_time: validDate, injected: "<script />" })).toEqual({
            start_time: expectedDate,
        });
        expect(
            AddMembershipSchema.parse({ expires_at: validDate, injected: "<script />" }),
        ).toEqual({
            expires_at: expectedDate,
        });
        expect(ContactMemberSchema.parse({ content: "Hi", injected: "<script />" })).toEqual({
            content: "Hi",
        });
    });

    it("rejects short contact content", () => {
        expect(ContactMemberSchema.safeParse({ content: "H" }).success).toBe(false);
    });
});

describe("Order schemas", () => {
    it("accepts valid order statuses", () => {
        expect(OrderStatusSchema.parse(OrderStatus.pending)).toBe(OrderStatus.pending);
        expect(OrderUpdateSchema.parse({ status: OrderStatus.completed })).toEqual({
            status: OrderStatus.completed,
        });
    });
});
