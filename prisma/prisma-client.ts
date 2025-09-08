import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Use a permissive global type so that the runtime-extended client doesn't
// produce a union type with incompatible overloads for TypeScript.
const globalForPrisma = global as unknown as { prisma?: any };

const prisma = globalForPrisma.prisma || new PrismaClient().$extends(withAccelerate());

// Cache the client on the global object (useful in development/hot-reload).
globalForPrisma.prisma = prisma;

export { prisma };
