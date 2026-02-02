import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/client";

const connectionString = `${process.env.DATABASE_URL}`

// Don't type the prisma client as it's dynamically extended by withAccelerate
const globalForPrisma = global as typeof global & { prisma?: PrismaClient<{ adapter: PrismaPg; }, never, DefaultArgs> };

const getPrismaClient = () => {
    const adapter = new PrismaPg({ connectionString })
    return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma || getPrismaClient();
globalForPrisma.prisma = prisma;

export { prisma }
