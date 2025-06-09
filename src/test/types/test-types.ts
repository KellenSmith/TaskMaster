import { DeepMockProxy } from "vitest-mock-extended";

// Create a simpler mock type that doesn't include the problematic circular references
export type MockPrisma = {
    user: {
        findUniqueOrThrow: any;
        create: any;
        findMany: any;
        update: any;
        count: any;
        delete: any;
        deleteMany: any;
    };
    userCredentials: {
        create: any;
        update: any;
        deleteMany: any;
    };
    event: {
        findMany: any;
    };
    product: {
        findUniqueOrThrow: any;
        findMany: any;
        create: any;
        update: any;
        delete: any;
        count: any;
    };
    textContent: {
        create: any;
        findUnique: any;
        update: any;
        delete: any;
    };
    order: {
        findUniqueOrThrow: any;
        findMany: any;
        create: any;
        update: any;
        delete: any;
    };
    orderItem: {
        create: any;
        findMany: any;
        update: any;
        delete: any;
    };
    $transaction: any;
};

export type TestContext = {
    prisma: DeepMockProxy<MockPrisma>;
};
