import { Router } from "express";
import { prisma } from "@revestia/db";
import { PLANS, estimateQuantity } from "@revestia/shared";
import { z } from "zod";
import { parse } from "../lib/http";

export const publicRouter = Router();

publicRouter.get("/plans", (_req, res) => {
  res.json(Object.values(PLANS));
});

publicRouter.post("/leads", async (req, res) => {
  const body = parse(
    z.object({ email: z.string().email(), name: z.string().max(80).optional(), company: z.string().max(120).optional() }),
    req.body,
  );
  const lead = await prisma.lead.upsert({
    where: { email: body.email.toLowerCase() },
    update: { name: body.name, company: body.company },
    create: { ...body, email: body.email.toLowerCase() },
  });
  res.status(201).json({ id: lead.id });
});

publicRouter.post("/pageview", async (req, res) => {
  const body = parse(z.object({ visitorId: z.string().min(4).max(64), path: z.string().max(200) }), req.body);
  await prisma.pageView.create({ data: body });
  res.status(204).end();
});

publicRouter.post("/estimate", (req, res) => {
  const body = parse(
    z.object({ areaM2: z.number().positive(), m2PerBox: z.number().positive(), wastePct: z.number().min(0).max(50).optional(), pricePerBox: z.number().nonnegative().optional() }),
    req.body,
  );
  res.json(estimateQuantity(body));
});
