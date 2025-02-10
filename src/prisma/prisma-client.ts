import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();
