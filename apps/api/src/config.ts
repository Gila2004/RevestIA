const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

/** Acepta una o varias URLs separadas por coma. */
const list = (v: string | undefined, fallback: string) =>
  (v ?? fallback)
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-cambiar-en-produccion",
  corsOrigins: [
    ...list(process.env.CLIENT_APP_URL, "http://localhost:5173"),
    ...list(process.env.ADMIN_APP_URL, "http://localhost:5174"),
  ],
};

if (isProd && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET es obligatorio en producción");
}
