import "dotenv/config";
import { PrismaClient } from "./generated/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const getPrismaClient = () => {
    return new PrismaClient({
        accelerateUrl: process.env.ACCELERATE_DATABASE_URL as string,
    }).$extends(withAccelerate());
};

const globalForPrisma = global as typeof global & { prisma?: ReturnType<typeof getPrismaClient> };

const prisma = globalForPrisma.prisma || getPrismaClient();
globalForPrisma.prisma = prisma;

export { prisma };
