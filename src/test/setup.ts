import "@testing-library/jest-dom";
import { expect, afterEach, vi, beforeEach, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { mockContext } from "./mocks/prismaMock";
import utc from "dayjs/plugin/utc";
import dayjs from "dayjs";
import type { Transporter } from "nodemailer";
import { getMailTransport } from "../app/lib/mail-service/mail-transport";
import testdata from "./testdata";
// Ensure all date formatting uses UTC to avoid environment-specific timezone shifts
dayjs.extend(utc);

// Extend vitest's expect method with testing-library methods
expect.extend(matchers);

const originalEnv = process.env;

vi.mock("../prisma/prisma-client", () => ({
    prisma: mockContext.prisma,
}));
vi.mock("@/app/lib/mail-service/mail-transport", () => ({
    getMailTransport: vi.fn().mockResolvedValue({
        sendMail: vi.fn().mockResolvedValue({ accepted: [], rejected: [] }),
    } as unknown as Transporter),
}));
vi.mock("next/cache", () => ({
    revalidateTag: vi.fn(),
}));

afterAll(() => {
    process.env = originalEnv;
});

beforeEach(() => {
    vi.resetAllMocks();
    // Provide stable env defaults for tests
    process.env = { ...originalEnv, ...testdata.env };
    // Reassert mockimplementation for mail transport before each test
    vi.mocked(getMailTransport).mockResolvedValue({
        sendMail: vi.fn().mockResolvedValue({ accepted: [], rejected: [] }),
    } as unknown as Transporter);
    mockContext.prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockContext.prisma as any);
    });
});

// Clear up after each test
afterEach(() => {
    cleanup();
});
