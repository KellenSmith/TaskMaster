import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

const connectionString = `${process.env.DATABASE_URL}`;

// Don't type the prisma client as it's dynamically extended by withAccelerate
const globalForPrisma = global as typeof global & { prisma?: PrismaClient };

const getPrismaClient = () => {
    // In serverless environments (Vercel), function instances can be frozen and
    // thawed between requests. The pool's underlying TCP connections may be
    // silently dropped by the database server or network layer during that idle
    // period. Configuring the pool with a short idleTimeoutMillis ensures dead
    // connections are discarded before they are reused, and max:1 keeps the
    // connection footprint minimal per serverless instance.
    const pool = new Pool({
        connectionString,
        max: 1,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 10_000,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
};

const prisma = globalForPrisma.prisma || getPrismaClient();
globalForPrisma.prisma = prisma;

export { prisma };
