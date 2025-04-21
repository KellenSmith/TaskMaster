import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { beforeEach } from "vitest";

// mockDeep creates a deeply mocked PrismaClient
// This means all properties and methods, no matter how deeply nested,
// are automatically mocked while maintaining type safety
//
// Example structure of mocked prisma client:
// prisma.user.findUnique() -> mocked
// prisma.user.findMany() -> mocked
// prisma.event.create() -> mocked
// prisma.event.update() -> mocked
// etc...

export type MockPrismaClient = DeepMockProxy<PrismaClient>;
export const prisma = mockDeep<PrismaClient>();

// Example usage in tests:
//
// // Mock a simple query
// prisma.user.findUnique.mockResolvedValue({ id: '1', name: 'Test' });
//
// // Mock nested relations
// prisma.event.findFirst.mockResolvedValue({
//   id: '1',
//   tasks: [{ id: 't1', name: 'Task 1' }],
//   participants: [{ id: 'p1', name: 'User 1' }]
// });
//
// // Mock chain of calls
// prisma.user.findMany.mockResolvedValue([]);
// prisma.user.create.mockResolvedValue({ id: 'new' });

// Reset mock between tests
beforeEach(() => {
    mockReset(prisma);
});

// Helper to create typed mock responses
export const createMockPrismaResponse = <T>(data: T): Promise<T> => {
    return Promise.resolve(data);
};
