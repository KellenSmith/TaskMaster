import "@testing-library/jest-dom";
import { expect, afterEach, vi, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { mockContext } from "./mocks/prismaMock";

// Extend vitest's expect method with testing-library methods
expect.extend(matchers);

beforeEach(() => {
    vi.resetAllMocks(); // Mock the Prisma module
    // Mock the prisma-client file used in the app
    // to ensure the tests are insulated from the database
    vi.mock("../../prisma/prisma-client", () => ({
        prisma: mockContext.prisma,
    }));
    // Mock the nodemailer transport
    vi.mock("../app/lib/mail-service/mail-transport", () => ({
        mailTransport: {
            sendMail: vi.fn().mockResolvedValue(undefined),
        },
    }));
    vi.mock("next/cache", () => ({
        unstable_cache: (fn) => {
            // return a wrapper that just calls the original function (no Next caching)
            return (...args) => fn(...args);
        },
    }));
});

// Clear up after each test
afterEach(() => {
    cleanup();
});
