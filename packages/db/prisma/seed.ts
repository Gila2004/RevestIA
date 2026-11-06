// Datos de demostración. Ejecutar: npm run db:seed
// Con --if-empty no hace nada si la base ya tiene usuarios (se usa en el deploy).
// En producción definí SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD para no usar las credenciales públicas.
import bcrypt from "bcryptjs";
import { prisma } from "../src/index";

const DEMO = {
  superadmin: {
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@revestia.app",
    password: process.env.SEED_ADMIN_PASSWORD ?? "RevestIA2026!",
  },
  client: { email: "demo@ceramicasdelsur.com", password: process.env.SEED_DEMO_PASSWORD ?? "Demo2026!" },
};

// PRNG determinístico para que el seed sea reproducible
let s = 42;
const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (a: number, b: number) => Math.floor(a + rand() * (b - a + 1));
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000 - between(0, 86400000));

const coatings = [
  { name: "Porcelanato Calacatta Oro", category: "PISO", material: "Porcelanato", finish: "Pulido", color: "#ece6dc", pattern: "stone", m2PerBox: 1.44 },
  { name: "Cerámica Terracota Rústica", category: "PISO", material: "Cerámica", finish: "Mate", color: "#b5653b", pattern: "tile", m2PerBox: 1.8 },
  { name: "Vinílico Roble Nórdico", category: "PISO", material: "Vinílico SPC", finish: "Texturado", color: "#c9a77c", pattern: "plank", m2PerBox: 2.2 },
  { name: "Subway Blanco Brillante", category: "PARED", material: "Cerámica", finish: "Brillante", color: "#f4f1ec", pattern: "tile", m2PerBox: 1.0 },
  { name: "Venecita Verde Salvia", category: "BANO", material: "Vidrio", finish: "Brillante", color: "#8a9a7b", pattern: "mosaic", m2PerBox: 2.0 },
  { name: "Piedra Laja Patagónica", category: "EXTERIOR", material: "Piedra natural", finish: "Natural", color: "#8c8273", pattern: "stone", m2PerBox: 1.0 },
  { name: "Hidráulico Cementicio Gris", category: "COCINA", material: "Cemento", finish: "Mate", color: "#9b9a96", pattern: "tile", m2PerBox: 1.0 },
  { name: "Porcelanato Símil Madera Nogal", category: "PISO", material: "Porcelanato", finish: "Mate", color: "#7a5236", pattern: "plank", m2PerBox: 1.32 },
];

const commerces = [
  { name: "Cerámicas del Sur", plan: "PREMIUM", billingStatus: "PAID" },
  { name: "Revestimientos Andes", plan: "FREEMIUM", billingStatus: "PAID" },
  { name: "Casa Porcelanato", plan: "PREMIUM", billingStatus: "DUE" },
  { name: "Pisos & Muros Rosario", plan: "FREEMIUM", billingStatus: "DUE" },
  { name: "Hidráulicos Palermo", plan: "FREE", billingStatus: "PAID" },
  { name: "Obra Fina Córdoba", plan: "FREEMIUM", billingStatus: "PAID" },
  { name: "Mosaicos Litoral", plan: "FREE", billingStatus: "PAID" },
  { name: "Piedra & Diseño", plan: "PREMIUM", billingStatus: "PAID" },
];

const names = ["Lucía", "Martín", "Sofía", "Juan", "Valentina", "Tomás", "Camila", "Mateo", "Julieta", "Nicolás", "Agustina", "Federico"];

async function main() {
  if (process.argv.includes("--if-empty") && (await prisma.user.count()) > 0) {
    console.log("✔ La base ya tiene datos: seed omitido");
    return;
  }
  if ((process.env.VERCEL || process.env.NODE_ENV === "production") && !process.env.SEED_ADMIN_PASSWORD) {
    throw new Error("Definí SEED_ADMIN_PASSWORD antes de cargar datos en producción");
  }
  console.log("Limpiando base…");
  await prisma.$transaction([
    prisma.sale.deleteMany(),
    prisma.visualization.deleteMany(),
    prisma.endUser.deleteMany(),
    prisma.paymentMethod.deleteMany(),
    prisma.product.deleteMany(),
    prisma.user.deleteMany(),
    prisma.commerce.deleteMany(),
    prisma.coating.deleteMany(),
    prisma.lead.deleteMany(),
    prisma.pageView.deleteMany(),
  ]);

  await prisma.user.create({
    data: {
      email: DEMO.superadmin.email,
      name: "Equipo RevestIA",
      role: "SUPERADMIN",
      passwordHash: await bcrypt.hash(DEMO.superadmin.password, 10),
    },
  });

  const catalog = await Promise.all(
    coatings.map((c) => prisma.coating.create({ data: { ...c, wastePct: c.pattern === "plank" ? 8 : 10 } })),
  );

  const clientHash = await bcrypt.hash(DEMO.client.password, 10);

  for (const [i, c] of commerces.entries()) {
    const slug = c.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");
    const createdAt = daysAgo(between(40, 200));
    const commerce = await prisma.commerce.create({
      data: {
        name: c.name,
        slug,
        contactEmail: i === 0 ? DEMO.client.email : `hola@${slug}.com`,
        plan: c.plan,
        billingStatus: c.billingStatus,
        planExpiresAt: c.plan === "FREE" ? null : new Date(Date.now() + between(-20, 45) * 86400000),
        createdAt,
        users: {
          create: {
            email: i === 0 ? DEMO.client.email : `admin@${slug}.com`,
            name: i === 0 ? "Carla Méndez" : `Admin ${c.name}`,
            role: "CLIENT",
            passwordHash: clientHash,
          },
        },
        paymentMethods: {
          create: [
            { type: "MERCADOPAGO", label: "Mercado Pago", details: "Link de pago / QR" },
            { type: "TRANSFERENCIA", label: "Transferencia bancaria", details: "CBU a confirmar" },
          ],
        },
      },
    });

    const productCount = c.plan === "FREE" ? 3 : between(5, 8);
    const products = [];
    for (const cat of catalog.slice(0, productCount)) {
      products.push(
        await prisma.product.create({
          data: {
            commerceId: commerce.id,
            coatingId: cat.id,
            name: cat.name,
            sku: `${slug.slice(0, 3).toUpperCase()}-${between(100, 999)}`,
            category: cat.category,
            color: cat.color,
            pattern: cat.pattern,
            m2PerBox: cat.m2PerBox,
            wastePct: cat.wastePct,
            pricePerBox: between(18, 65) * 1000,
            stockBoxes: between(0, 400),
          },
        }),
      );
    }

    const userCount = c.plan === "PREMIUM" ? between(35, 60) : c.plan === "FREEMIUM" ? between(15, 30) : between(2, 6);
    for (let u = 0; u < userCount; u++) {
      const first = pick(names);
      const created = daysAgo(between(0, 175));
      const endUser = await prisma.endUser.create({
        data: { commerceId: commerce.id, email: `${first.toLowerCase()}.${u}${i}@mail.com`, name: first, createdAt: created },
      });
      const vizCount = between(1, 4);
      for (let v = 0; v < vizCount; v++) {
        const p = pick(products);
        const area = between(8, 60);
        const boxes = Math.ceil((area * 1.1) / p.m2PerBox);
        const vDate = new Date(created.getTime() + v * 3600000);
        await prisma.visualization.create({
          data: { commerceId: commerce.id, endUserId: endUser.id, productId: p.id, areaM2: area, boxes, createdAt: vDate },
        });
        if (v === 0 && rand() < 0.42) {
          await prisma.sale.create({
            data: { commerceId: commerce.id, endUserId: endUser.id, productId: p.id, areaM2: area, boxes, total: boxes * p.pricePerBox, createdAt: new Date(vDate.getTime() + 86400000) },
          });
        }
      }
    }
  }

  // Leads de la landing y visitas
  for (let l = 0; l < 26; l++) {
    await prisma.lead.create({
      data: {
        email: `interesado${l}@${pick(["gmail.com", "hotmail.com", "outlook.com", "empresa.com.ar"])}`,
        name: pick(names),
        company: rand() < 0.6 ? `Revestimientos ${pick(["Norte", "Centro", "Oeste", "Express", "Premium"])}` : null,
        status: rand() < 0.25 ? "CONVERTED" : "NEW",
        createdAt: daysAgo(between(0, 175)),
      },
    });
  }
  for (let p = 0; p < 420; p++) {
    await prisma.pageView.create({ data: { visitorId: `v${between(1, 260)}`, path: pick(["/", "/#planes", "/registro"]), createdAt: daysAgo(between(0, 175)) } });
  }

  console.log("✔ Seed listo");
  if (!process.env.VERCEL && process.env.NODE_ENV !== "production") {
    console.log(`  SUPERADMIN → ${DEMO.superadmin.email} / ${DEMO.superadmin.password}`);
    console.log(`  CLIENTE    → ${DEMO.client.email} / ${DEMO.client.password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
