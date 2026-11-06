export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-cambiar-en-produccion",
  corsOrigins: [process.env.CLIENT_APP_URL ?? "http://localhost:5173", process.env.ADMIN_APP_URL ?? "http://localhost:5174"],
};
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET es obligatorio en producción");
}
