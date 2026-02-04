import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import {
    AddEventParticipantSchema,
    AddEventReserveSchema,
    AddMembershipSchema,
    CloneEventSchema,
    ContactMemberSchema,
    EmailSendoutSchema,
    EventCreateSchema,
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
import { EventStatus, OrderStatus, TaskStatus, TicketType, UserRole } from "@/prisma/generated/client";
import testdata from "../../test/testdata";

const validDate = "03/02/2026 14:30";
const expectedDate = dayjs.utc(validDate, "DD/MM/YYYY HH:mm").format();

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
    it("accepts empty email and strips id", () => {
        const result = OrganizationSettingsUpdateSchema.parse({
            id: "should-be-removed",
            event_manager_email: "",
            primary_color: "#fff",
        });

        expect(result.event_manager_email).toBe("");
        expect("id" in result).toBe(false);
    });

    it("rejects invalid hex color", () => {
        const result = OrganizationSettingsUpdateSchema.safeParse({
            primary_color: "not-a-color",
        });

        expect(result.success).toBe(false);
    });
});

describe("InfoPage schemas", () => {
    it("enforces title length and accepts empty role", () => {
        const result = InfoPageCreateSchema.parse({
            title: "About",
            lowest_allowed_user_role: "",
        });

        expect(result.title).toBe("About");
    });

    it("allows partial updates", () => {
        expect(InfoPageUpdateSchema.parse({})).toEqual({});
    });
});

describe("User schemas", () => {
    it("lowercases email and parses skill badges", () => {
        const result = UserCreateSchema.parse({
            email: "TEST@Example.com",
            role: UserRole.member,
            consent_to_newsletters: "true",
            skill_badges: "alpha,beta",
        });

        expect(result.email).toBe("test@example.com");
        expect(result.consent_to_newsletters).toBe(true);
        expect(result.skill_badges).toEqual(["alpha", "beta"]);
    });

    it("accepts base user values from testdata", () => {
        const result = UserCreateSchema.parse({
            email: testdata.user.email,
            nickname: testdata.user.nickname,
            first_name: testdata.user.first_name,
            sur_name: testdata.user.sur_name,
            pronoun: testdata.user.pronoun,
            phone: testdata.user.phone,
        });

        expect(result.email).toBe(testdata.user.email);
    });
});

describe("EventCreateSchema", () => {
    it("transforms dates to ISO strings", () => {
        const result = EventCreateSchema.parse({
            title: "Planning Meeting",
            location_id: null,
            start_time: validDate,
            end_time: validDate,
            max_participants: "20",
            tags: "planning,team",
        });

        expect(result.start_time).toBe(expectedDate);
        expect(result.tags).toEqual(["planning", "team"]);
        expect(result.max_participants).toBe(20);
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

describe("Task schemas", () => {
    it("parses select-multiple inputs and optional status", () => {
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
        });

        expect(result.tags).toEqual(["alpha", "beta"]);
        expect(result.skill_badges).toEqual(["badge-a", "badge-b"]);
        expect(result.start_time).toBe(expectedDate);
    });
});

describe("Product and membership schemas", () => {
    it("coerces and rounds price to cents", () => {
        const result = ProductCreateSchema.parse({
            ...baseProduct,
            price: "10.255",
            stock: "3",
        });

        expect(result.price).toBe(1026);
        expect(result.stock).toBe(3);
    });

    it("requires duration for memberships", () => {
        expect(MembershipWithoutProductSchema.safeParse({}).success).toBe(false);
        expect(
            MembershipCreateSchema.safeParse({
                ...baseProduct,
                duration: 365,
            }).success,
        ).toBe(true);
    });
});

describe("Ticket schemas", () => {
    it("creates tickets with product data", () => {
        const result = TicketCreateSchema.parse({
            type: TicketType.standard,
            name: "Ticketed Product",
            vat_percentage: 25,
            price: 50,
        });

        expect(result.type).toBe(TicketType.standard);
        expect(result.price).toBe(5000);
    });

    it("accepts ticket without relations", () => {
        const result = TicketWithoutRelationsSchema.parse({
            type: TicketType.volunteer,
        });

        expect(result.type).toBe(TicketType.volunteer);
    });
});

describe("Text content schemas", () => {
    it("accepts full text content payload", () => {
        const result = TextContentCreateSchema.parse({
            id: "text-id",
            language: "en",
            content: "Hello",
            category: null,
        });

        expect(result.content).toBe("Hello");
    });

    it("requires composite keys on update", () => {
        const missingLanguage = TextContentUpdateSchema.safeParse({
            id: "text-id",
            content: "Updated",
        });

        expect(missingLanguage.success).toBe(false);
    });
});

describe("Custom schemas", () => {
    it("extends membership application with prompt", () => {
        const result = MembershipApplicationSchema.parse({
            email: "member@example.com",
            member_application_prompt: "Tell us about you",
        });

        expect(result.email).toBe("member@example.com");
        expect(result.member_application_prompt).toBe("Tell us about you");
    });

    it("lowercases login email", () => {
        const result = LoginSchema.parse({ email: "ADMIN@Example.com" });
        expect(result.email).toBe("admin@example.com");
    });

    it("validates UUID-based payloads", () => {
        expect(
            AddEventParticipantSchema.safeParse({
                user_id: "00000000-0000-0000-0000-000000000000",
                ticket_id: "00000000-0000-0000-0000-000000000000",
            }).success,
        ).toBe(true);

        expect(
            AddEventReserveSchema.safeParse({ user_id: "not-a-uuid" }).success,
        ).toBe(false);

        expect(UuidSchema.safeParse("not-a-uuid").success).toBe(false);
    });

    it("parses task filter toggles", () => {
        const result = TaskFilterSchema.parse({
            unassigned: "on",
            assigned_to_me: "off",
            begins_after: validDate,
            ends_before: "",
            has_tag: "alpha,beta",
            status: "open,done",
        });

        expect(result.unassigned).toBe(true);
        expect(result.assigned_to_me).toBe(false);
        expect(result.begins_after).toBe(expectedDate);
        expect(result.ends_before).toBe("");
        expect(result.has_tag).toEqual(["alpha", "beta"]);
        expect(result.status).toEqual(["open", "done"]);
    });

    it("validates auxiliary schemas", () => {
        expect(EmailSendoutSchema.safeParse({ subject: "Hi", content: "Body" }).success).toBe(
            true,
        );
        expect(UpdateTextContentSchema.safeParse({ text: "Updated" }).success).toBe(true);
        expect(CloneEventSchema.safeParse({ start_time: validDate }).success).toBe(true);
        expect(AddMembershipSchema.safeParse({ expires_at: validDate }).success).toBe(true);
        expect(ContactMemberSchema.safeParse({ content: "Hi" }).success).toBe(true);
    });

    it("rejects short contact content", () => {
        expect(ContactMemberSchema.safeParse({ content: "H" }).success).toBe(false);
    });
});

describe("Order schemas", () => {
    it("accepts valid order statuses", () => {
        expect(OrderStatusSchema.parse(OrderStatus.pending)).toBe(OrderStatus.pending);
        expect(
            OrderUpdateSchema.parse({ status: OrderStatus.completed }).status,
        ).toBe(OrderStatus.completed);
    });
});
