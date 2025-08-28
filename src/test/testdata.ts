import { Prisma, UserRole } from "@prisma/client";
import dayjs from "dayjs";

const testdata = {
    // Mock user data for testing
    user: {
        id: "test-user-id",
        first_name: "Test",
        sur_name: "User",
        pronoun: "they/them",
        nickname: "Test User",
        email: "test@example.com",
        role: UserRole.member,
        consent_to_newsletters: true,
        phone: "123-456-7890",
        created_at: dayjs().subtract(1, "year").toDate(),
        user_membership: {
            id: "test-membership-id",
            membership_id: "test-membership-id",
            user_id: "test-user-id",
            expires_at: dayjs().add(1, "year").toDate(),
        },
        user_credentials: {
            id: "test-user-credentials-id",
            user_id: "test-user-id",
            salt: "test-password-salt",
            hashed_password: "test-hashed-password",
        },
        skill_badges: [],
    } as Prisma.UserGetPayload<{
        include: { user_membership: true; user_credentials: true; skill_badges: true };
    }>,

    createUser: {
        firstName: "Johnnie",
        surName: "Doe",
        nickname: "johnniedoe123",
        pronoun: "they/them",
        email: "john.doe@example.com",
        phone: "+1-555-123-4567",
        consentToNewsletters: true,
    },

    userCredentials: {
        id: "cred-1234-5678",
        email: "john.doe@example.com",
        salt: "randomsalt123",
        hashedPassword: "hashedpassword456",
    },

    event: {
        id: "event-1234-5678",
        title: "Summer Coding Workshop",
        location: "Tech Hub, Downtown",
        start_time: new Date("2024-06-15T09:00:00Z"),
        end_time: new Date("2024-06-15T17:00:00Z"),
        description: "Learn coding basics in this one-day workshop",
        max_participants: 20,
        full_ticket_price: 50,
        status: "published",
        host_id: "1234-5678-9abc-def0",
    },

    participantInEvent: {
        user_id: "1234-5678-9abc-def0",
        event_id: "event-1234-5678",
    },

    reserveInEvent: {
        user_id: "1234-5678-9abc-def0",
        event_id: "event-1234-5678",
        queueing_since: new Date("2024-01-15T12:00:00Z"),
    },

    task: {
        id: "task-1234-5678",
        event_id: "event-1234-5678",
        assignee_id: "1234-5678-9abc-def0",
        reviewer_id: "1234-5678-9abc-def0",
        name: "Prepare Workshop Materials",
        status: "in progress",
        tags: ["preparation", "documentation"],
        start_time: new Date("2024-06-14T09:00:00Z"),
        end_time: new Date("2024-06-14T17:00:00Z"),
        description: "Create and organize workshop materials for participants",
    },

    product: {
        id: "prod-1234-5678",
        name: "Test Product",
        description: "A test product for testing",
        price: 99.99,
        created_at: new Date("2024-01-01T00:00:00Z"),
        updated_at: new Date("2024-01-01T00:00:00Z"),
        unlimited_stock: false,
        stock: 0,
        image_url: "",
    },

    createProduct: {
        name: "New Test Product",
        description: "A new test product",
        price: 49.99,
    },
    createMembership: {
        duration: 365,
    },

    order: {
        id: "order-1234-5678",
        created_at: new Date("2024-01-01T00:00:00Z"),
        updated_at: new Date("2024-01-01T00:00:00Z"),
        status: "pending",
        total_amount: 149.98,
        user_id: "1234-5678-9abc-def0",
        order_items: [
            {
                id: "item-1234-5678",
                quantity: 2,
                price: 99.99,
                order_id: "order-1234-5678",
                product_id: "prod-1234-5678",
                product: {
                    id: "prod-1234-5678",
                    name: "Test Product",
                    description: "A test product for testing",
                    price: 99.99,
                    created_at: new Date("2024-01-01T00:00:00Z"),
                    updated_at: new Date("2024-01-01T00:00:00Z"),
                    membership: {
                        duration: 365,
                    },
                    ticket: null,
                },
            },
        ],
    },

    createOrderItems: {
        "prod-1234-5678": 2,
        "prod-5678-9abc": 1,
    },
};

export default testdata;
