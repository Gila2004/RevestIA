import { Router } from "express";
import { prisma } from "@revestia/db";
import { CATEGORIES, PATTERNS, PAYMENT_TYPES, PLAN_CODES } from "@revestia/shared";
import { z } from "zod";
import { HttpError, bucketByMonth, lastMonths, parse } from "../lib/http";
import { commerceIdOf, requireAuth } from "../lib/auth";
import { planUsage } from "../services/usage";

export const clientRouter = Router();
clientRouter.use(requireAuth("client"));

/** Comercio + uso del plan + KPIs del panel. */
clientRouter.get("/me", async (req, res) => {
  const id = commerceIdOf(req);
  const commerce = await prisma.commerce.findUniqueOrThrow({ where: { id } });
  const [usage, salesAgg, endUsers, endUsersWithSale, visualizations] = await Promise.all([
    planUsage(id, commerce.plan),
    prisma.sale.aggregate({ where: { commerceId: id }, _count: true, _sum: { total: true } }),
    prisma.endUser.count({ where: { commerceId: id } }),
    prisma.endUser.count({ where: { commerceId: id, sales: { some: {} } } }),
    prisma.visualization.count({ where: { commerceId: id } }),
  ]);
  res.json({
    commerce,
    usage,
    kpis: {
      salesCount: salesAgg._count,
      salesTotal: salesAgg._sum.total ?? 0,
      endUsers,
      endUsersNoPurchase: endUsers - endUsersWithSale,
      visualizations,
    },
  });
});

clientRouter.patch("/commerce", async (req, res) => {
  const body = parse(
    z.object({
      name: z.string().min(2).max(120).optional(),
      phone: z.string().max(40).nullable().optional(),
      website: z.string().max(200).nullable().optional(),
    }),
    req.body,
  );
  res.json(await prisma.commerce.update({ where: { id: commerceIdOf(req) }, data: body }));
});

clientRouter.get("/stats", async (req, res) => {
  const id = commerceIdOf(req);
  const { keys, from } = lastMonths(6);
  const [sales, viz] = await Promise.all([
    prisma.sale.findMany({ where: { commerceId: id, createdAt: { gte: from } }, select: { createdAt: true, total: true } }),
    prisma.visualization.findMany({ where: { commerceId: id, createdAt: { gte: from } }, select: { createdAt: true } }),
  ]);
  const s = bucketByMonth(sales, keys);
  const v = bucketByMonth(viz, keys);
  res.json(keys.map((k) => ({ month: k, ventas: s[k], visualizaciones: v[k] })));
});

/** Cambio de plan. La facturación queda pendiente (DUE) hasta confirmar el pago. */
clientRouter.post("/plan", async (req, res) => {
  const { plan } = parse(z.object({ plan: z.enum(PLAN_CODES) }), req.body);
  const updated = await prisma.commerce.update({
    where: { id: commerceIdOf(req) },
    data: {
      plan,
      billingStatus: plan === "FREE" ? "PAID" : "DUE",
      planExpiresAt: plan === "FREE" ? null : new Date(Date.now() + 30 * 86400000),
    },
  });
  res.json(updated);
});

/* ---------- Revestimientos del comercio ---------- */
const productSchema = z.object({
  coatingId: z.string().nullable().optional(),
  name: z.string().min(2).max(120),
  sku: z.string().max(40).nullable().optional(),
  category: z.enum(CATEGORIES),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#c8b8a6"),
  pattern: z.enum(PATTERNS).default("tile"),
  m2PerBox: z.number().positive(),
  wastePct: z.number().min(0).max(50).default(10),
  pricePerBox: z.number().nonnegative(),
  stockBoxes: z.number().int().nonnegative(),
  imageUrl: z.string().url().nullable().optional(),
  active: z.boolean().default(true),
});

clientRouter.get("/catalog", async (_req, res) => {
  res.json(await prisma.coating.findMany({ orderBy: { name: "asc" } }));
});

clientRouter.get("/products", async (req, res) => {
  res.json(await prisma.product.findMany({ where: { commerceId: commerceIdOf(req) }, orderBy: { createdAt: "desc" } }));
});

clientRouter.post("/products", async (req, res) => {
  const id = commerceIdOf(req);
  const commerce = await prisma.commerce.findUniqueOrThrow({ where: { id } });
  const usage = await planUsage(id, commerce.plan);
  if (usage.productsLeft === 0) {
    throw new HttpError(402, `Tu plan ${usage.plan.name} permite hasta ${usage.plan.maxProducts} revestimientos. Mejorá tu plan para cargar más.`);
  }
  res.status(201).json(await prisma.product.create({ data: { ...parse(productSchema, req.body), commerceId: id } }));
});

clientRouter.patch("/products/:id", async (req, res) => {
  const where = { id: req.params.id, commerceId: commerceIdOf(req) };
  const { count } = await prisma.product.updateMany({ where, data: parse(productSchema.partial(), req.body) });
  if (!count) throw new HttpError(404, "Revestimiento no encontrado");
  res.json(await prisma.product.findUnique({ where: { id: req.params.id } }));
});

clientRouter.delete("/products/:id", async (req, res) => {
  await prisma.product.deleteMany({ where: { id: req.params.id, commerceId: commerceIdOf(req) } });
  res.status(204).end();
});

/* ---------- Medios de pago ---------- */
const paymentSchema = z.object({
  type: z.enum(PAYMENT_TYPES),
  label: z.string().min(2).max(80),
  details: z.string().max(300).nullable().optional(),
  active: z.boolean().default(true),
});

clientRouter.get("/payment-methods", async (req, res) => {
  res.json(await prisma.paymentMethod.findMany({ where: { commerceId: commerceIdOf(req) }, orderBy: { createdAt: "asc" } }));
});
clientRouter.post("/payment-methods", async (req, res) => {
  res.status(201).json(await prisma.paymentMethod.create({ data: { ...parse(paymentSchema, req.body), commerceId: commerceIdOf(req) } }));
});
clientRouter.patch("/payment-methods/:id", async (req, res) => {
  const { count } = await prisma.paymentMethod.updateMany({
    where: { id: req.params.id, commerceId: commerceIdOf(req) },
    data: parse(paymentSchema.partial(), req.body),
  });
  if (!count) throw new HttpError(404, "Medio de pago no encontrado");
  res.json({ ok: true });
});
clientRouter.delete("/payment-methods/:id", async (req, res) => {
  await prisma.paymentMethod.deleteMany({ where: { id: req.params.id, commerceId: commerceIdOf(req) } });
  res.status(204).end();
});

/* ---------- Ventas con RevestIA ---------- */
clientRouter.get("/sales", async (req, res) => {
  res.json(
    await prisma.sale.findMany({
      where: { commerceId: commerceIdOf(req) },
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { product: { select: { name: true } }, endUser: { select: { email: true } } },
    }),
  );
});

/** Registrar manualmente una venta hecha con ayuda de RevestIA (ej. en el local). */
clientRouter.post("/sales", async (req, res) => {
  const id = commerceIdOf(req);
  const body = parse(
    z.object({ productId: z.string(), boxes: z.number().int().positive(), endUserEmail: z.string().email().optional() }),
    req.body,
  );
  const product = await prisma.product.findFirst({ where: { id: body.productId, commerceId: id } });
  if (!product) throw new HttpError(404, "Revestimiento no encontrado");
  const endUser = body.endUserEmail
    ? await prisma.endUser.findUnique({ where: { commerceId_email: { commerceId: id, email: body.endUserEmail.toLowerCase() } } })
    : null;
  const [sale] = await prisma.$transaction([
    prisma.sale.create({
      data: {
        commerceId: id,
        productId: product.id,
        endUserId: endUser?.id,
        boxes: body.boxes,
        areaM2: body.boxes * product.m2PerBox,
        total: body.boxes * product.pricePerBox,
      },
    }),
    prisma.product.update({ where: { id: product.id }, data: { stockBoxes: Math.max(0, product.stockBoxes - body.boxes) } }),
  ]);
  res.status(201).json(sale);
});

/* ---------- Usuarios finales (emails) ---------- */
clientRouter.get("/end-users", async (req, res) => {
  const users = await prisma.endUser.findMany({
    where: { commerceId: commerceIdOf(req) },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sales: true, visualizations: true } } },
  });
  res.json(users.map(({ _count, ...u }) => ({ ...u, sales: _count.sales, visualizations: _count.visualizations })));
});
