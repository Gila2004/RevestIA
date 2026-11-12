// Crea o actualiza las cuentas de acceso a partir de variables de entorno.
// Se ejecuta en cada deploy (después del seed), así cambiar una variable en Vercel
// y volver a publicar alcanza para cambiar un usuario o una contraseña.
// Las credenciales viven solo en las variables, nunca en el repositorio.
//
//   SEED_ADMIN_EMAIL     + SEED_ADMIN_PASSWORD     → cuenta SUPERADMIN principal
//   DEMO_ADMIN_EMAIL     + DEMO_ADMIN_PASSWORD     → cuenta SUPERADMIN extra para demos/presentaciones
//   DEMO_CLIENT_EMAIL    + DEMO_CLIENT_PASSWORD    → cuenta de CLIENTE (comercio) para demos
//   DEMO_CLIENT_COMMERCE (opcional, slug)          → comercio al que entra; por defecto ceramicas-del-sur
//
// Si falta el email o la contraseña de una cuenta, esa cuenta no se toca.
import bcrypt from "bcryptjs";
import { prisma } from "../src/index";

const clean = (v: string | undefined) => v?.trim().toLowerCase() || undefined;

async function upsertUser(email: string, password: string, role: "SUPERADMIN" | "CLIENT", name: string, commerceId: string | null) {
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role, commerceId },
    create: { email, passwordHash, role, name, commerceId },
  });
  console.log(`✔ Cuenta ${role === "SUPERADMIN" ? "superadmin" : "cliente"} lista: ${email}`);
}

async function main() {
  const adminEmail = clean(process.env.SEED_ADMIN_EMAIL);
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await upsertUser(adminEmail, adminPassword, "SUPERADMIN", "Equipo RevestIA", null);
  }

  const demoAdminEmail = clean(process.env.DEMO_ADMIN_EMAIL);
  const demoAdminPassword = process.env.DEMO_ADMIN_PASSWORD;
  if (demoAdminEmail && demoAdminPassword) {
    await upsertUser(demoAdminEmail, demoAdminPassword, "SUPERADMIN", "Superadmin demo", null);
  }

  const clientEmail = clean(process.env.DEMO_CLIENT_EMAIL);
  const clientPassword = process.env.DEMO_CLIENT_PASSWORD;
  if (clientEmail && clientPassword) {
    if (clientEmail === adminEmail || clientEmail === demoAdminEmail) {
      console.warn("⚠ DEMO_CLIENT_EMAIL coincide con un superadmin: la cuenta de cliente no se crea");
      return;
    }
    const slug = process.env.DEMO_CLIENT_COMMERCE?.trim() || "ceramicas-del-sur";
    const commerce = await prisma.commerce.findUnique({ where: { slug } });
    if (!commerce) {
      console.warn(`⚠ No existe el comercio "${slug}": la cuenta de cliente no se crea`);
      return;
    }
    await upsertUser(clientEmail, clientPassword, "CLIENT", "Cuenta demo", commerce.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
