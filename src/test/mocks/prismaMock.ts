import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy, mockReset } from "vitest-mock-extended";
import { beforeEach } from "vitest";

export type Context = {
    prisma: PrismaClient;
};

export type MockContext = {
    prisma: DeepMockProxy<PrismaClient>;
};

export const createMockContext = (): MockContext => {
    return {
        prisma: mockDeep<PrismaClient>(),
    };
};

export const mockContext = createMockContext();

beforeEach(() => {
    mockReset(mockContext.prisma);
});
