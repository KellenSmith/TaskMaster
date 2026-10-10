import "dotenv/config";
import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

// Single return type: a union of the extended and plain client makes TypeScript choke.
const getPrismaClient = (): PrismaClient => {
    if (process.env.ACCELERATE_DATABASE_URL) {
        return new PrismaClient({
            accelerateUrl: process.env.ACCELERATE_DATABASE_URL as string,
        }).$extends(withAccelerate()) as unknown as PrismaClient;
    }
    if (process.env.DIRECT_DATABASE_URL) {
        const adapter = new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL });
        return new PrismaClient({ adapter });
    }
    throw new Error("No database URL provided in environment variables.");
};

const globalForPrisma = global as typeof global & { prisma?: ReturnType<typeof getPrismaClient> };

const prisma = globalForPrisma.prisma || getPrismaClient();
globalForPrisma.prisma = prisma;

export type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export { prisma };
