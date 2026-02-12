import { DeepMockProxy } from "vitest-mock-extended";
import { MockedFunction } from "vitest"

type prismaOperations = {
    findUniqueOrThrow: MockedFunction<() => Promise<any>>;
    findUnique: MockedFunction<() => Promise<any>>;
    findFirst: MockedFunction<() => Promise<any>>;
    findFirstOrThrow: MockedFunction<() => Promise<any>>;
    create: MockedFunction<() => Promise<any>>;
    createMany: MockedFunction<() => Promise<any>>;
    upsert: MockedFunction<() => Promise<any>>;
    findMany: MockedFunction<() => Promise<any>>;
    update: MockedFunction<() => Promise<any>>;
    count: MockedFunction<() => Promise<any>>;
    delete: MockedFunction<() => Promise<any>>;
    deleteMany: MockedFunction<() => Promise<any>>;
};

// Create a simpler mock type that doesn't include the problematic circular references
export type MockPrisma = {
    organizationSettings: prismaOperations;
    user: prismaOperations;
    userSkillBadge: prismaOperations;
    newsletterJob: prismaOperations;
    event: prismaOperations;
    eventParticipant: prismaOperations;
    eventReserve: prismaOperations;
    skillBadge: prismaOperations;
    task: prismaOperations;
    product: prismaOperations;
    membership: prismaOperations;
    userMembership: prismaOperations;
    ticket: prismaOperations;
    order: prismaOperations;
    orderItem: prismaOperations;
    textContent: prismaOperations;
    $transaction: MockedFunction<(callback: TransactionCallback) => Promise<unknown>>;
};

export type TransactionClient = Omit<MockPrisma, "$transaction">;
export type TransactionCallback = (client: TransactionClient) => Promise<unknown>;

export type TestContext = {
    prisma: DeepMockProxy<MockPrisma>;
};
