import { mockDeep } from "vitest-mock-extended";
import { MockOrderStatus, MockPrisma, TestContext } from "../types/test-types";

export const createMockContext = (): TestContext => ({
    prisma: mockDeep<MockPrisma>(),
    OrderStatus: {
        pending: "pending",
        paid: "paid",
        cancelled: "cancelled",
        completed: "completed",
    } as any,
});

export const mockContext: TestContext = createMockContext();
