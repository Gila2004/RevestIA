import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Si no hay DATABASE_URL, apuntamos al SQLite de desarrollo de este paquete.
if (!process.env.DATABASE_URL) {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  process.env.DATABASE_URL = "file:" + path.resolve(dir, "../prisma/dev.db");
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
