import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@revestia/db";
import { slugify } from "@revestia/shared";
import { z } from "zod";
import { HttpError, parse } from "../lib/http";
import { signToken } from "../lib/auth";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

/** Login exclusivo del SUPERADMIN (app admin). */
export const adminAuthRouter = Router();
adminAuthRouter.post("/login", async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.role !== "SUPERADMIN" || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Credenciales inválidas");
  }
  res.json({ token: signToken({ sub: user.id, role: "SUPERADMIN" }, "admin"), user: { name: user.name, email: user.email } });
});

/** Login y registro de comercios (app cliente). */
export const clientAuthRouter = Router();
clientAuthRouter.post("/login", async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.role !== "CLIENT" || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Credenciales inválidas");
  }
  res.json({
    token: signToken({ sub: user.id, role: "CLIENT", commerceId: user.commerceId ?? undefined }, "client"),
    user: { name: user.name, email: user.email },
  });
});

clientAuthRouter.post("/register", async (req, res) => {
  const body = parse(
    z.object({
      commerceName: z.string().min(2).max(120),
      name: z.string().min(2).max(80),
      email: z.string().email(),
      password: z.string().min(8, "Mínimo 8 caracteres"),
      phone: z.string().max(40).optional(),
      website: z.string().max(200).optional(),
    }),
    req.body,
  );
  const email = body.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) throw new HttpError(409, "Ese email ya tiene una cuenta");

  let slug = slugify(body.commerceName) || "comercio";
  if (await prisma.commerce.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const commerce = await prisma.commerce.create({
    data: {
      name: body.commerceName,
      slug,
      contactEmail: email,
      phone: body.phone,
      website: body.website,
      plan: "FREE",
      users: { create: { email, name: body.name, role: "CLIENT", passwordHash: await bcrypt.hash(body.password, 10) } },
    },
    include: { users: true },
  });
  await prisma.lead.updateMany({ where: { email }, data: { status: "CONVERTED" } });

  const user = commerce.users[0];
  res.status(201).json({
    token: signToken({ sub: user.id, role: "CLIENT", commerceId: commerce.id }, "client"),
    user: { name: user.name, email: user.email },
  });
});
