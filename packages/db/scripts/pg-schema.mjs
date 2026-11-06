// Genera prisma/schema.postgres.prisma a partir de schema.prisma (SQLite).
// Así hay una sola fuente de verdad: SQLite para desarrollo local y
// Postgres (Neon) para producción en Vercel.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = resolve(dirname(fileURLToPath(import.meta.url)), "../prisma");
let schema = readFileSync(resolve(dir, "schema.prisma"), "utf8");

schema = schema
  .replace('provider = "sqlite"', 'provider = "postgresql"')
  // Motor de Prisma para las funciones serverless de Vercel (Amazon Linux)
  .replace('provider = "prisma-client-js"', 'provider      = "prisma-client-js"\n  binaryTargets = ["native", "rhel-openssl-3.0.x"]');

// La integración Neon de Vercel define una URL directa (sin pooler) para aplicar el esquema
if (process.env.DATABASE_URL_UNPOOLED) {
  schema = schema.replace('url      = env("DATABASE_URL")', 'url       = env("DATABASE_URL")\n  directUrl = env("DATABASE_URL_UNPOOLED")');
}

writeFileSync(resolve(dir, "schema.postgres.prisma"), "// ARCHIVO GENERADO por scripts/pg-schema.mjs — no editar\n" + schema);
console.log("✔ prisma/schema.postgres.prisma generado");
