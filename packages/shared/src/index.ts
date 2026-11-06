// Lógica de dominio compartida por API, MCP y frontends.

export const ROLES = ["SUPERADMIN", "CLIENT"] as const;
export type Role = (typeof ROLES)[number];

export const PLAN_CODES = ["FREE", "FREEMIUM", "PREMIUM"] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const BILLING_STATUS = ["PAID", "DUE"] as const;
export type BillingStatus = (typeof BILLING_STATUS)[number];

export const CATEGORIES = ["PISO", "PARED", "BANO", "COCINA", "EXTERIOR"] as const;
export type Category = (typeof CATEGORIES)[number];

export const PATTERNS = ["tile", "plank", "stone", "mosaic"] as const;
export type Pattern = (typeof PATTERNS)[number];

export const PAYMENT_TYPES = ["MERCADOPAGO", "TRANSFERENCIA", "TARJETA", "EFECTIVO", "OTRO"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  priceMonthlyUsd: number;
  tagline: string;
  /** Visualizaciones por mes. null = ilimitadas */
  visualizationsPerMonth: number | null;
  /** Productos en el catálogo del comercio. null = ilimitados */
  maxProducts: number | null;
  features: string[];
  highlighted?: boolean;
}

/** Precios de referencia: ajustar según estrategia comercial. */
export const PLANS: Record<PlanCode, PlanDefinition> = {
  FREE: {
    code: "FREE",
    name: "Free",
    priceMonthlyUsd: 0,
    tagline: "Probá RevestIA sin costo",
    visualizationsPerMonth: 1,
    maxProducts: 3,
    features: [
      "1 visualización de ambiente",
      "Calculadora de cantidades (m² → cajas)",
      "Hasta 3 revestimientos cargados",
      "Registro obligatorio del usuario por email",
    ],
  },
  FREEMIUM: {
    code: "FREEMIUM",
    name: "Freemium",
    priceMonthlyUsd: 29,
    tagline: "Para comercios que empiezan a digitalizar su venta",
    visualizationsPerMonth: 150,
    maxProducts: 50,
    highlighted: true,
    features: [
      "150 visualizaciones por mes",
      "Hasta 50 revestimientos con precio y stock",
      "Base de emails de tus usuarios",
      "Registro de ventas hechas con RevestIA",
      "Widget para integrar en tu web",
    ],
  },
  PREMIUM: {
    code: "PREMIUM",
    name: "Premium",
    priceMonthlyUsd: 79,
    tagline: "Escalá con visualizaciones ilimitadas y métricas",
    visualizationsPerMonth: null,
    maxProducts: null,
    features: [
      "Visualizaciones ilimitadas",
      "Catálogo ilimitado",
      "Métricas de conversión: quién vio y no compró",
      "Exportación de emails (CSV)",
      "Marca personalizada y soporte prioritario",
    ],
  },
};

export interface QuantityInput {
  /** Superficie a cubrir en m² */
  areaM2: number;
  /** m² que cubre una caja */
  m2PerBox: number;
  /** % de desperdicio por cortes (por defecto 10%) */
  wastePct?: number;
  /** Precio por caja (opcional, para estimar total) */
  pricePerBox?: number;
}

export interface QuantityResult {
  areaM2: number;
  wastePct: number;
  areaWithWasteM2: number;
  boxes: number;
  coveredM2: number;
  total: number | null;
}

/** Calcula cuántas cajas comprar, siempre redondeando hacia arriba. */
export function estimateQuantity({ areaM2, m2PerBox, wastePct = 10, pricePerBox }: QuantityInput): QuantityResult {
  if (!(areaM2 > 0)) throw new Error("La superficie debe ser mayor a 0");
  if (!(m2PerBox > 0)) throw new Error("Los m² por caja deben ser mayores a 0");
  const areaWithWaste = areaM2 * (1 + wastePct / 100);
  const boxes = Math.ceil(round(areaWithWaste / m2PerBox, 6));
  return {
    areaM2: round(areaM2),
    wastePct,
    areaWithWasteM2: round(areaWithWaste),
    boxes,
    coveredM2: round(boxes * m2PerBox),
    total: pricePerBox != null ? round(boxes * pricePerBox) : null,
  };
}

/** Superficie de una pared o piso rectangular, descontando aberturas. */
export function areaFromDimensions(widthM: number, heightM: number, openingsM2 = 0): number {
  return round(Math.max(0, widthM * heightM - openingsM2));
}

export function round(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}
