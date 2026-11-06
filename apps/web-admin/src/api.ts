import { createApi } from "@revestia/ui";

/** Sesión del SUPERADMIN. Usa su propia clave y su propia audiencia de token en la API. */
export const API_BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

export const api = createApi({
  baseUrl: API_BASE,
  tokenKey: "revestia.admin.token",
  onUnauthorized: () => {
    api.setToken(null);
    if (location.pathname !== "/login") location.href = "/login";
  },
});

export interface Metrics {
  commerces: number;
  payingCommerces: number;
  commercesDue: number;
  byPlan: Record<string, number>;
  mrrUsd: number;
  salesCount: number;
  salesTotal: number;
  salesThisMonth: number;
  endUsers: number;
  endUsersNoPurchase: number;
  visualizations: number;
  conversionRate: number;
  landingVisitors: number;
  leads: number;
  leadsNotConverted: number;
}

export interface ChartRow {
  month: string;
  ventas: number;
  montoVentas: number;
  visualizaciones: number;
  nuevosComercios: number;
  leads: number;
}

export interface ClientRow {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  users: number;
  sales: number;
  products: number;
  visualizations: number;
  plan: "FREE" | "FREEMIUM" | "PREMIUM";
  planExpiresAt: string | null;
  billingStatus: "PAID" | "DUE";
  createdAt: string;
}
