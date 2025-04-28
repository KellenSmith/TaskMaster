import { mockDeep } from "vitest-mock-extended";
import { MockPrisma, TestContext } from "../types/test-types";

export const createMockContext = (): TestContext => ({
    prisma: mockDeep<MockPrisma>(),
});

export const mockContext: TestContext = createMockContext();
