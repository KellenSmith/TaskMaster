import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { UserRole } from "../prisma/generated/enums";
import { Prisma } from "../prisma/generated/client";

dayjs.extend(utc);

const testdata = {
    env: {
        AUTH_SECRET: "test-auth-secret",
        BLOB_HOSTNAME: "test-blob-hostname",
        CRON_SECRET: "test-cron-secret",
        DATABASE_URL: "postgresql://test:test@localhost:5432/test",
        BLOB_READ_WRITE_TOKEN: "test-blob-token",
        EMAIL: "test@example.com",
        EMAIL_PASSWORD: "test-password",
        GOOGLE_SITE_VERIFICATION: "test-google-verification",
        NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
        NEXT_PUBLIC_ORG_DESCRIPTION: "Test org",
        NEXT_PUBLIC_ORG_NAME: "TaskMaster",
        NEXT_PUBLIC_SEO_KEYWORDS: "test,seo",
        SMTP_HOST: "smtp.test",
        SMTP_PORT: "587",
        SWEDBANK_BASE_URL: "https://api.example.com",
        SWEDBANK_PAY_ACCESS_TOKEN: "test-access-token",
        SWEDBANK_PAY_PAYEE_ID: "00000000-0000-0000-0000-000000000000",
        VERCEL_OIDC_TOKEN: "test-oidc",
        VERCEL_PROJECT_PRODUCTION_URL: "localhost:3000",
    },
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
        created_at: dayjs.utc().subtract(1, "year").toDate(),
        user_membership: {
            id: "test-membership-id",
            membership_id: "test-membership-id",
            user_id: "test-user-id",
            expires_at: dayjs.utc().add(1, "year").toDate(),
        },
        skill_badges: [],
    } as unknown as Prisma.UserGetPayload<{
        include: { user_membership: true; skill_badges: true };
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
