import { DeepMockProxy } from "vitest-mock-extended";

type prismaOperations = {
    findUniqueOrThrow;
    findUnique;
    findFirst;
    create;
    findMany;
    update;
    count;
    delete;
    deleteMany;
};

// Create a simpler mock type that doesn't include the problematic circular references
export type MockPrisma = {
    organizationSettings: prismaOperations;
    user: prismaOperations;
    event: prismaOperations;
    eventParticipant: prismaOperations;
    eventReserve: prismaOperations;
    task: prismaOperations;
    product: prismaOperations;
    membership: prismaOperations;
    userMembership: prismaOperations;
    ticket: prismaOperations;
    order: prismaOperations;
    orderItem: prismaOperations;
    textContent: prismaOperations;
    $transaction;
};

export type TestContext = {
    prisma: DeepMockProxy<MockPrisma>;
};
