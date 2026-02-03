import "@testing-library/jest-dom";
import { expect, afterEach, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { mockContext } from "./mocks/prismaMock";
import utc from "dayjs/plugin/utc";
import dayjs from "dayjs";
import { getMailTransport } from "../app/lib/mail-service/mail-transport";
import type { Transporter } from "nodemailer";
// Ensure all date formatting uses UTC to avoid environment-specific timezone shifts
dayjs.extend(utc);

// Extend vitest's expect method with testing-library methods
expect.extend(matchers);

vi.mock("@/app/lib/mail-service/mail-transport", () => ({
    getMailTransport: vi.fn(),
}));

const originalEnv = process.env;

beforeAll(() => {
    // Provide stable env defaults for tests
    process.env = { ...originalEnv };
    process.env.AUTH_SECRET = "test-auth-secret";
    process.env.BLOB_HOSTNAME = "test-blob-hostname";
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.POSTGRES_URL = "postgresql://test:test@localhost:5432/test";
    process.env.PRISMA_DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.BLOB_READ_WRITE_TOKEN = "test-blob-token";
    process.env.EMAIL = "test@example.com";
    process.env.EMAIL_PASSWORD = "test-password";
    process.env.GOOGLE_SITE_VERIFICATION = "test-google-verification";
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_OFFER_MEMBERSHIP_SUBSCRIPTION = "true";
    process.env.NEXT_PUBLIC_ORG_DESCRIPTION = "Test org";
    process.env.NEXT_PUBLIC_ORG_NAME = "TaskMaster";
    process.env.NEXT_PUBLIC_SEO_DESCRIPTION = "Test SEO";
    process.env.NEXT_PUBLIC_SEO_KEYWORDS = "test,seo";
    process.env.NEXT_PUBLIC_SEO_TITLE = "TaskMaster";
    process.env.SMTP_HOST = "smtp.test";
    process.env.SMTP_PORT = "587";
    process.env.SWEDBANK_BASE_URL = "https://api.example.com";
    process.env.SWEDBANK_PAY_ACCESS_TOKEN = "test-access-token";
    process.env.SWEDBANK_PAY_PAYEE_ID = "00000000-0000-0000-0000-000000000000";
    process.env.VERCEL_OIDC_TOKEN = "test-oidc";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "localhost:3000";
});

afterAll(() => {
    process.env = originalEnv;
});

beforeEach(() => {
    vi.resetAllMocks(); // Mock the Prisma module
    // Mock the prisma-client file used in the app
    // to ensure the tests are insulated from the database
    vi.mock("../../prisma/prisma-client", () => ({
        prisma: mockContext.prisma,
    }));
    // Mock the nodemailer transport
    vi.mocked(getMailTransport).mockResolvedValue({
        sendMail: vi.fn().mockResolvedValue({ accepted: [], rejected: [] }),
    } as unknown as Transporter);
});

// Clear up after each test
afterEach(() => {
    cleanup();
});
