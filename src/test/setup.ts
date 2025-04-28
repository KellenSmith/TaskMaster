import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { mockContext } from "./mocks/prismaMock";

// Mock the Prisma module
vi.mock("@prisma/client", () => ({
    PrismaClient: vi.fn(() => mockContext.prisma),
}));

// Mock your lib/prisma file
vi.mock("../lib/prisma", () => ({
    prisma: mockContext.prisma,
}));

// Extend vitest's expect method with testing-library methods
expect.extend(matchers as any);

// Clear up after each test
afterEach(() => {
    cleanup();
});
