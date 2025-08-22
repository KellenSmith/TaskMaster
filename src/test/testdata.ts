import { Prisma, UserRole } from "@prisma/client";
import dayjs from "dayjs";

const testdata = {
    // Mock user data for testing
    user: {
        id: "test-user-id",
        firstName: "Test",
        surName: "User",
        pronoun: "they/them",
        nickname: "Test User",
        email: "test@example.com",
        role: UserRole.user,
        consentToNewsletters: true,
        phone: "123-456-7890",
        createdAt: dayjs().subtract(1, "year").toDate(),
        userMembership: {
            id: "test-membership-id",
            membershipId: "test-membership-id",
            userId: "test-user-id",
            expiresAt: dayjs().add(1, "year").toDate(),
        },
        userCredentials: {
            id: "test-user-credentials-id",
            userId: "test-user-id",
            salt: "test-password-salt",
            hashedPassword: "test-hashed-password",
        },
    } as Prisma.UserGetPayload<{
        include: { userMembership: true; userCredentials: true };
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
        startTime: new Date("2024-06-15T09:00:00Z"),
        endTime: new Date("2024-06-15T17:00:00Z"),
        description: "Learn coding basics in this one-day workshop",
        maxParticipants: 20,
        fullTicketPrice: 50,
        status: "published",
        hostId: "1234-5678-9abc-def0",
    },

    participantInEvent: {
        userId: "1234-5678-9abc-def0",
        eventId: "event-1234-5678",
    },

    reserveInEvent: {
        userId: "1234-5678-9abc-def0",
        eventId: "event-1234-5678",
        queueingSince: new Date("2024-01-15T12:00:00Z"),
    },

    task: {
        id: "task-1234-5678",
        eventId: "event-1234-5678",
        assigneeId: "1234-5678-9abc-def0",
        reporterId: "1234-5678-9abc-def0",
        phase: "before",
        name: "Prepare Workshop Materials",
        status: "in progress",
        tags: ["preparation", "documentation"],
        startTime: new Date("2024-06-14T09:00:00Z"),
        endTime: new Date("2024-06-14T17:00:00Z"),
        description: "Create and organize workshop materials for participants",
    },

    product: {
        id: "prod-1234-5678",
        name: "Test Product",
        description: "A test product for testing",
        price: 99.99,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        unlimitedStock: false,
        stock: 0,
        imageUrl: "",
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
        createdAt: new Date("2024-01-01T00:00:00Z"),
        updatedAt: new Date("2024-01-01T00:00:00Z"),
        status: "pending",
        totalAmount: 149.98,
        userId: "1234-5678-9abc-def0",
        orderItems: [
            {
                id: "item-1234-5678",
                quantity: 2,
                price: 99.99,
                orderId: "order-1234-5678",
                productId: "prod-1234-5678",
                product: {
                    id: "prod-1234-5678",
                    name: "Test Product",
                    description: "A test product for testing",
                    price: 99.99,
                    createdAt: new Date("2024-01-01T00:00:00Z"),
                    updatedAt: new Date("2024-01-01T00:00:00Z"),
                    Membership: {
                        duration: 365,
                    },
                    Ticket: null,
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
