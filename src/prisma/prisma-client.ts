import "dotenv/config";
import { PrismaClient } from "./generated/client";

const getPrismaClient = () => {
    // Prisma Client 7 speaks the Accelerate protocol natively via `accelerateUrl`.
    // Do NOT re-apply `@prisma/extension-accelerate` on top of it: the extension
    // overwrites `customDataProxyFetch` instead of wrapping it, which drops the
    // `Prisma-Transaction-Routing` cookie the engine attaches to every statement
    // inside an interactive transaction. Every `$transaction` then fails with
    // "P6000: Missing Prisma-Transaction-Routing cookie".
    return new PrismaClient({
        accelerateUrl: process.env.ACCELERATE_DATABASE_URL as string,
    });
};

const globalForPrisma = global as typeof global & { prisma?: ReturnType<typeof getPrismaClient> };

const prisma = globalForPrisma.prisma || getPrismaClient();
globalForPrisma.prisma = prisma;

export type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export { prisma };
