import { createApi } from "@revestia/ui";

/** Sesión del COMERCIO. Clave propia: no comparte nada con la app superadmin. */
export const api = createApi({
  tokenKey: "revestia.client.token",
  onUnauthorized: () => {
    api.setToken(null);
    if (location.pathname.startsWith("/panel")) location.href = "/ingresar";
  },
});

export interface Commerce {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  phone: string | null;
  website: string | null;
  plan: "FREE" | "FREEMIUM" | "PREMIUM";
  planExpiresAt: string | null;
  billingStatus: "PAID" | "DUE";
}

export interface Product {
  id: string;
  coatingId: string | null;
  name: string;
  sku: string | null;
  category: string;
  color: string;
  pattern: "tile" | "plank" | "stone" | "mosaic";
  m2PerBox: number;
  wastePct: number;
  pricePerBox: number;
  stockBoxes: number;
  active: boolean;
}

export interface Me {
  commerce: Commerce;
  usage: {
    plan: import("@revestia/shared").PlanDefinition;
    visualizationsThisMonth: number;
    visualizationsLeft: number | null;
    products: number;
    productsLeft: number | null;
  };
  kpis: { salesCount: number; salesTotal: number; endUsers: number; endUsersNoPurchase: number; visualizations: number };
}

/** Identificador anónimo del visitante de la landing (métrica "entró y no se registró"). */
export function visitorId() {
  try {
    let v = localStorage.getItem("revestia.vid");
    if (!v) {
      v = Math.random().toString(36).slice(2, 12);
      localStorage.setItem("revestia.vid", v);
    }
    return v;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2, 8);
  }
}
