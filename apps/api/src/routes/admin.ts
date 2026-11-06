import { Router } from "express";
import { prisma } from "@revestia/db";
import { BILLING_STATUS, CATEGORIES, PATTERNS, PLAN_CODES, PLANS, type PlanCode } from "@revestia/shared";
import { z } from "zod";
import { bucketByMonth, lastMonths, parse } from "../lib/http";
import { requireAuth } from "../lib/auth";

export const adminRouter = Router();
adminRouter.use(requireAuth("admin"));

/** KPIs generales de la plataforma. */
adminRouter.get("/metrics", async (_req, res) => {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [commerces, salesAgg, salesMonth, endUsers, endUsersWithSale, visualizations, leads, leadsNew, visitors] = await Promise.all([
    prisma.commerce.findMany({ select: { plan: true, billingStatus: true } }),
    prisma.sale.aggregate({ _count: true, _sum: { total: true } }),
    prisma.sale.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.endUser.count(),
    prisma.endUser.count({ where: { sales: { some: {} } } }),
    prisma.visualization.count(),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.pageView.groupBy({ by: ["visitorId"] }).then((r) => r.length),
  ]);

  const paying = commerces.filter((c) => c.plan !== "FREE");
  const mrr = paying.filter((c) => c.billingStatus === "PAID").reduce((acc, c) => acc + PLANS[c.plan as PlanCode].priceMonthlyUsd, 0);
  const byPlan = Object.fromEntries(PLAN_CODES.map((p) => [p, commerces.filter((c) => c.plan === p).length]));

  res.json({
    commerces: commerces.length,
    payingCommerces: paying.length,
    commercesDue: commerces.filter((c) => c.billingStatus === "DUE").length,
    byPlan,
    mrrUsd: mrr,
    salesCount: salesAgg._count,
    salesTotal: salesAgg._sum.total ?? 0,
    salesThisMonth: salesMonth,
    endUsers,
    /** Usuarios finales que visualizaron pero no compraron */
    endUsersNoPurchase: endUsers - endUsersWithSale,
    visualizations,
    conversionRate: endUsers ? endUsersWithSale / endUsers : 0,
    landingVisitors: visitors,
    leads,
    /** Interesados que dejaron su email y aún no crearon cuenta */
    leadsNotConverted: leadsNew,
  });
});

/** Series mensuales comparables. */
adminRouter.get("/charts", async (req, res) => {
  const months = Math.min(12, Math.max(3, Number(req.query.months ?? 6)));
  const { keys, from } = lastMonths(months);
  const where = { createdAt: { gte: from } };
  const [sales, viz, commerces, leads] = await Promise.all([
    prisma.sale.findMany({ where, select: { createdAt: true, total: true } }),
    prisma.visualization.findMany({ where, select: { createdAt: true } }),
    prisma.commerce.findMany({ where, select: { createdAt: true } }),
    prisma.lead.findMany({ where, select: { createdAt: true } }),
  ]);
  const s = bucketByMonth(sales, keys);
  const st = bucketByMonth(sales, keys, (r) => r.total);
  const v = bucketByMonth(viz, keys);
  const c = bucketByMonth(commerces, keys);
  const l = bucketByMonth(leads, keys);
  res.json(
    keys.map((k) => ({ month: k, ventas: s[k], montoVentas: st[k], visualizaciones: v[k], nuevosComercios: c[k], leads: l[k] })),
  );
});

/** Tabla de clientes B2B. */
adminRouter.get("/clients", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const rows = await prisma.commerce.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { contactEmail: { contains: q } }] } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { endUsers: true, sales: true, products: true, visualizations: true } } },
  });
  res.json(
    rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      contactEmail: c.contactEmail,
      users: c._count.endUsers,
      sales: c._count.sales,
      products: c._count.products,
      visualizations: c._count.visualizations,
      plan: c.plan,
      planExpiresAt: c.planExpiresAt,
      billingStatus: c.billingStatus,
      createdAt: c.createdAt,
    })),
  );
});

adminRouter.patch("/clients/:id", async (req, res) => {
  const body = parse(
    z.object({
      plan: z.enum(PLAN_CODES).optional(),
      billingStatus: z.enum(BILLING_STATUS).optional(),
      planExpiresAt: z.coerce.date().nullable().optional(),
    }),
    req.body,
  );
  const updated = await prisma.commerce.update({ where: { id: req.params.id }, data: body });
  res.json(updated);
});

/** Emails registrados: leads de la landing y usuarios finales de cada comercio. */
adminRouter.get("/emails", async (req, res) => {
  const type = req.query.type === "endusers" ? "endusers" : "leads";
  if (type === "leads") {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" } });
    return res.json(leads.map((l) => ({ id: l.id, email: l.email, name: l.name, company: l.company, status: l.status, createdAt: l.createdAt })));
  }
  const users = await prisma.endUser.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { commerce: { select: { name: true } }, _count: { select: { sales: true, visualizations: true } } },
  });
  res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      company: u.commerce.name,
      status: u._count.sales > 0 ? "COMPRÓ" : "NO COMPRÓ",
      visualizations: u._count.visualizations,
      createdAt: u.createdAt,
    })),
  );
});

/** Catálogo maestro de revestimientos. */
const coatingSchema = z.object({
  name: z.string().min(2).max(120),
  category: z.enum(CATEGORIES),
  material: z.string().min(2).max(60),
  finish: z.string().min(2).max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  pattern: z.enum(PATTERNS),
  m2PerBox: z.number().positive(),
  wastePct: z.number().min(0).max(50).default(10),
  imageUrl: z.string().url().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});

adminRouter.get("/coatings", async (_req, res) => {
  const rows = await prisma.coating.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { products: true } } } });
  res.json(rows.map(({ _count, ...c }) => ({ ...c, usedBy: _count.products })));
});
adminRouter.post("/coatings", async (req, res) => {
  res.status(201).json(await prisma.coating.create({ data: parse(coatingSchema, req.body) }));
});
adminRouter.patch("/coatings/:id", async (req, res) => {
  res.json(await prisma.coating.update({ where: { id: req.params.id }, data: parse(coatingSchema.partial(), req.body) }));
});
adminRouter.delete("/coatings/:id", async (req, res) => {
  await prisma.coating.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
