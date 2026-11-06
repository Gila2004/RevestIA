import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { HttpError } from "./http";

/**
 * Cada app tiene su propia "audiencia": un token emitido para la app de clientes
 * NO sirve en la app de superadmin y viceversa.
 */
export type Audience = "admin" | "client" | "widget";

export interface TokenPayload {
  sub: string;
  role: "SUPERADMIN" | "CLIENT" | "END_USER";
  commerceId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

export function signToken(payload: TokenPayload, audience: Audience) {
  return jwt.sign(payload, config.jwtSecret, { audience, expiresIn: audience === "widget" ? "30d" : "7d" });
}

const ROLE_BY_AUDIENCE: Record<Audience, TokenPayload["role"]> = {
  admin: "SUPERADMIN",
  client: "CLIENT",
  widget: "END_USER",
};

export function requireAuth(audience: Audience) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new HttpError(401, "Falta token de acceso");
    try {
      const payload = jwt.verify(token, config.jwtSecret, { audience }) as TokenPayload;
      if (payload.role !== ROLE_BY_AUDIENCE[audience]) throw new Error("rol");
      req.auth = payload;
      next();
    } catch {
      throw new HttpError(401, "Sesión inválida o sin permisos para esta sección");
    }
  };
}

export function commerceIdOf(req: Request): string {
  const id = req.auth?.commerceId;
  if (!id) throw new HttpError(403, "Usuario sin comercio asociado");
  return id;
}
