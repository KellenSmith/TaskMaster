import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Don't type the prisma client as it's dynamically extended by withAccelerate
const globalForPrisma = global as typeof global & { prisma? };
const prisma = globalForPrisma.prisma || new PrismaClient().$extends(withAccelerate());
globalForPrisma.prisma = prisma;

export { prisma };
