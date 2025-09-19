import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

type ExtendedPrismaClient = ReturnType<PrismaClient["$extends"]>;
const globalForPrisma = global as typeof global & { prisma?: ExtendedPrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient().$extends(withAccelerate());
globalForPrisma.prisma = prisma;

export { prisma };
