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
  /** Segundo nombre comercial, ej: "Pilot Trial" */
  subtitle: string;
  priceMonthlyUsd: number;
  /** Aclaración del precio, ej: "durante 14 días" */
  priceNote?: string;
  /** Fee de implementación (pago único). 0 = sin costo de setup */
  setupFeeUsd: number;
  setupFeeNote?: string;
  /** Perfil de cliente al que apunta el plan */
  tagline: string;
  /** Visualizaciones por mes. null = ilimitadas */
  visualizationsPerMonth: number | null;
  /** Productos en el catálogo del comercio. null = ilimitados */
  maxProducts: number | null;
  features: string[];
  highlighted?: boolean;
}

/**
 * Única fuente de verdad de los planes: la usan la bienvenida, /comercios, el registro,
 * el panel del cliente, los límites de la API y el MRR del superadmin.
 */
export const PLANS: Record<PlanCode, PlanDefinition> = {
  FREE: {
    code: "FREE",
    name: "Free",
    subtitle: "Pilot Trial",
    priceMonthlyUsd: 0,
    priceNote: "durante 14 días",
    setupFeeUsd: 0,
    tagline: "Locales o corralones en fase de prueba/validación.",
    visualizationsPerMonth: null,
    maxProducts: 20,
    features: [
      "Prueba gratuita de 14 días, sin costo de setup",
      "Hasta 20 SKUs de productos",
      "Visualizador AR + IA (básico)",
      "Calculadora estándar (m²)",
      "Métricas básicas de uso",
      "Soporte vía correo electrónico",
    ],
  },
  FREEMIUM: {
    code: "FREEMIUM",
    name: "Freemium",
    subtitle: "Standard SaaS",
    priceMonthlyUsd: 20,
    // ~4,5 meses de licencia: carga del catálogo (hasta 500 SKUs), marca y capacitación
    setupFeeUsd: 90,
    setupFeeNote: "pago único",
    tagline: "Comercios y distribuidores de gama media/alta con presencia digital.",
    visualizationsPerMonth: null,
    maxProducts: 500,
    highlighted: true,
    features: [
      "Logo y colores de tu marca",
      "Hasta 500 SKUs sincronizados",
      "Visualizador AR + IA de recomendación avanzada",
      "Calculadora + desperdicio + conversión a cajas",
      "Tablero de analítica de ventas e interés de clientes",
      "Sincronización diaria de stock",
      "Soporte prioritario y capacitación comercial",
    ],
  },
  PREMIUM: {
    code: "PREMIUM",
    name: "Premium",
    subtitle: "Enterprise / Custom",
    priceMonthlyUsd: 35,
    priceNote: "o a medida",
    // ~5,5 meses de licencia: suma migración de catálogo, dominio propio e integración ERP (tope USD 200)
    setupFeeUsd: 190,
    setupFeeNote: "pago único: setup avanzado + migración",
    tagline: "Cadenas nacionales o distribuidores mayoristas multibrand.",
    visualizationsPerMonth: null,
    maxProducts: null,
    features: [
      "White-Label total con dominio propio",
      "Catálogo ilimitado de productos",
      "Visualizador AR + IA en ultra HD con IA predictiva",
      "Integración directa con pasarela de pago/ERP",
      "Dashboard BI avanzado + CRM de prospectos integrado",
      "Stock e inventario en tiempo real",
      "Account Manager dedicado 24/7 y SLA garantizado",
    ],
  },
};

/** Precio mensual para mostrar: "Gratis", "USD 20 / mes"... */
export function formatPlanPrice(p: PlanDefinition, withNote = false): string {
  const base = p.priceMonthlyUsd === 0 ? "USD 0 / mes" : `USD ${p.priceMonthlyUsd.toLocaleString("es-AR")} / mes`;
  return withNote && p.priceNote ? `${base} (${p.priceNote})` : base;
}

/** Fee de implementación para mostrar: "Sin costo de setup", "USD 90 (pago único)"... */
export function formatSetupFee(p: PlanDefinition): string {
  if (p.setupFeeUsd === 0) return "Sin costo de setup";
  const base = `USD ${p.setupFeeUsd.toLocaleString("es-AR")}`;
  return p.setupFeeNote ? `${base} (${p.setupFeeNote})` : base;
}

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
