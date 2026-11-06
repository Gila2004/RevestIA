import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny, type z } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function parse<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Datos inválidos", details: err.flatten().fieldErrors });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  const code = (err as { code?: string })?.code;
  if (code === "P2002") return res.status(409).json({ error: "Ya existe un registro con esos datos" });
  if (code === "P2025") return res.status(404).json({ error: "No encontrado" });
  console.error(err);
  res.status(500).json({ error: "Error interno" });
}

/** Rango de los últimos N meses (incluye el actual) como claves YYYY-MM. */
export function lastMonths(n: number) {
  const now = new Date();
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  const from = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
  return { keys, from };
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function bucketByMonth<T extends { createdAt: Date }>(rows: T[], keys: string[], value: (r: T) => number = () => 1) {
  const map = Object.fromEntries(keys.map((k) => [k, 0])) as Record<string, number>;
  for (const r of rows) {
    const k = monthKey(r.createdAt);
    if (k in map) map[k] += value(r);
  }
  return map;
}
