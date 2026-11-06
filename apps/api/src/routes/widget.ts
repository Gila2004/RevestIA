import { Router } from "express";
import { prisma } from "@revestia/db";
import { estimateQuantity } from "@revestia/shared";
import { z } from "zod";
import { HttpError, parse } from "../lib/http";
import { requireAuth, signToken } from "../lib/auth";
import { planUsage } from "../services/usage";

/**
 * Widget embebible que el comercio agrega a su web.
 * El usuario final DEBE registrarse con email antes de visualizar.
 */
export const widgetRouter = Router();

async function commerceBySlug(slug: string) {
  const c = await prisma.commerce.findUnique({ where: { slug } });
  if (!c) throw new HttpError(404, "Comercio no encontrado");
  return c;
}

widgetRouter.get("/:slug", async (req, res) => {
  const c = await commerceBySlug(req.params.slug);
  const [products, usage, paymentMethods] = await Promise.all([
    prisma.product.findMany({
      where: { commerceId: c.id, active: true },
      select: {
        id: true, name: true, category: true, color: true, pattern: true,
        m2PerBox: true, wastePct: true, pricePerBox: true, stockBoxes: true, imageUrl: true,
      },
      orderBy: { name: "asc" },
    }),
    planUsage(c.id, c.plan),
    prisma.paymentMethod.findMany({ where: { commerceId: c.id, active: true }, select: { type: true, label: true } }),
  ]);
  res.json({ commerce: { name: c.name, slug: c.slug }, products, paymentMethods, visualizationsLeft: usage.visualizationsLeft });
});

widgetRouter.post("/:slug/register", async (req, res) => {
  const c = await commerceBySlug(req.params.slug);
  const body = parse(z.object({ email: z.string().email(), name: z.string().max(80).optional() }), req.body);
  const email = body.email.toLowerCase();
  const user = await prisma.endUser.upsert({
    where: { commerceId_email: { commerceId: c.id, email } },
    update: body.name ? { name: body.name } : {},
    create: { commerceId: c.id, email, name: body.name },
  });
  res.json({ token: signToken({ sub: user.id, role: "END_USER", commerceId: c.id }, "widget"), email: user.email });
});

const calcSchema = z.object({ productId: z.string(), areaM2: z.number().positive().max(10000) });

async function loadContext(slug: string, commerceIdFromToken: string | undefined, productId: string) {
  const c = await commerceBySlug(slug);
  if (commerceIdFromToken !== c.id) throw new HttpError(403, "Sesión de otro comercio");
  const product = await prisma.product.findFirst({ where: { id: productId, commerceId: c.id, active: true } });
  if (!product) throw new HttpError(404, "Revestimiento no disponible");
  return { c, product };
}

widgetRouter.post("/:slug/visualize", requireAuth("widget"), async (req, res) => {
  const body = parse(calcSchema, req.body);
  const { c, product } = await loadContext(req.params.slug as string, req.auth!.commerceId, body.productId);

  const usage = await planUsage(c.id, c.plan);
  if (usage.visualizationsLeft === 0) {
    throw new HttpError(402, "Este comercio alcanzó el límite de visualizaciones de su plan este mes.");
  }
  const result = estimateQuantity({ areaM2: body.areaM2, m2PerBox: product.m2PerBox, wastePct: product.wastePct, pricePerBox: product.pricePerBox });
  await prisma.visualization.create({
    data: { commerceId: c.id, endUserId: req.auth!.sub, productId: product.id, areaM2: body.areaM2, boxes: result.boxes },
  });
  res.json({ ...result, inStock: product.stockBoxes >= result.boxes, stockBoxes: product.stockBoxes });
});

widgetRouter.post("/:slug/purchase", requireAuth("widget"), async (req, res) => {
  const body = parse(calcSchema, req.body);
  const { c, product } = await loadContext(req.params.slug as string, req.auth!.commerceId, body.productId);
  const r = estimateQuantity({ areaM2: body.areaM2, m2PerBox: product.m2PerBox, wastePct: product.wastePct, pricePerBox: product.pricePerBox });
  if (product.stockBoxes < r.boxes) throw new HttpError(409, `Stock insuficiente: quedan ${product.stockBoxes} cajas`);
  const [sale] = await prisma.$transaction([
    prisma.sale.create({
      data: { commerceId: c.id, endUserId: req.auth!.sub, productId: product.id, boxes: r.boxes, areaM2: body.areaM2, total: r.total ?? 0 },
    }),
    prisma.product.update({ where: { id: product.id }, data: { stockBoxes: { decrement: r.boxes } } }),
  ]);
  res.status(201).json({ saleId: sale.id, ...r });
});
