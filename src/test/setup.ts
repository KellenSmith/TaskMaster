import "@testing-library/jest-dom";
import { expect, afterEach, vi, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { mockContext } from "./mocks/prismaMock";

// Extend vitest's expect method with testing-library methods
expect.extend(matchers as any);

beforeEach(() => {
    vi.resetAllMocks(); // Mock the Prisma module
    vi.mock("@prisma/client", () => ({
        PrismaClient: vi.fn(() => mockContext.prisma),
        OrderStatus: mockContext.OrderStatus,
    })); // Mock your lib/prisma file
    vi.mock("../lib/prisma", () => ({
        prisma: mockContext.prisma,
    }));

    // Mock the prisma-client file used in the app
    vi.mock("../prisma/prisma-client", () => ({
        prisma: mockContext.prisma,
    }));
});

// Clear up after each test
afterEach(() => {
    cleanup();
});
