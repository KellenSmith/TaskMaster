import { DeepMockProxy } from "vitest-mock-extended";

type prismaOperations = {
    findUniqueOrThrow: any;
    findUnique: any;
    findFirst: any;
    create: any;
    findMany: any;
    update: any;
    count: any;
    delete: any;
    deleteMany: any;
};

// Create a simpler mock type that doesn't include the problematic circular references
export type MockPrisma = {
    organizationSettings: prismaOperations;
    user: prismaOperations;
    userCredentials: prismaOperations;
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
    $transaction: any;
};

export type TestContext = {
    prisma: DeepMockProxy<MockPrisma>;
};
