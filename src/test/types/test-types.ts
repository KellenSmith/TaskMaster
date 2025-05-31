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
    textContent: {
        create: any;
        findUnique: any;
        update: any;
        delete: any;
    };
};

export type TestContext = {
    prisma: DeepMockProxy<MockPrisma>;
};
