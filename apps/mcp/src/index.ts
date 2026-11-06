#!/usr/bin/env node
/**
 * Servidor MCP de RevestIA.
 *
 * Expone la API REST como herramientas para agentes de IA (Claude, etc.).
 * No accede a la base de datos directamente: pasa SIEMPRE por la API,
 * así respeta la misma autenticación y separación de roles que las webs.
 *
 * Variables de entorno:
 *   REVESTIA_API_URL   (default http://localhost:4000/api)
 *   REVESTIA_SCOPE     "admin" | "client"   (default "client")
 *   REVESTIA_EMAIL / REVESTIA_PASSWORD      credenciales del scope elegido
 *   REVESTIA_API_TOKEN                      alternativa: token JWT ya emitido
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CATEGORIES, PATTERNS, PLANS, estimateQuantity } from "@revestia/shared";

const API = (process.env.REVESTIA_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
const SCOPE = process.env.REVESTIA_SCOPE === "admin" ? "admin" : "client";
let token = process.env.REVESTIA_API_TOKEN ?? "";

async function login() {
  const email = process.env.REVESTIA_EMAIL;
  const password = process.env.REVESTIA_PASSWORD;
  if (!email || !password) throw new Error("Configurá REVESTIA_API_TOKEN o REVESTIA_EMAIL/REVESTIA_PASSWORD");
  const r = await fetch(`${API}/${SCOPE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`Login falló (${r.status})`);
  token = ((await r.json()) as { token: string }).token;
}

async function api(path: string, init: RequestInit = {}, retry = true): Promise<unknown> {
  if (!token) await login();
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers ?? {}) },
  });
  if (r.status === 401 && retry && process.env.REVESTIA_EMAIL) {
    token = "";
    return api(path, init, false);
  }
  const body = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) throw new Error((body as { error?: string })?.error ?? `HTTP ${r.status}`);
  return body;
}

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] });

const server = new McpServer({ name: "revestia", version: "0.1.0" });

/* ---------- Herramientas comunes ---------- */
server.tool(
  "estimar_cantidad",
  "Calcula cuántas cajas de revestimiento comprar para una superficie, con % de desperdicio por cortes.",
  {
    areaM2: z.number().positive().describe("Superficie a cubrir en m²"),
    m2PerBox: z.number().positive().describe("m² que cubre cada caja"),
    wastePct: z.number().min(0).max(50).optional().describe("Desperdicio %, por defecto 10"),
    pricePerBox: z.number().nonnegative().optional(),
  },
  async (args) => ok(estimateQuantity(args)),
);

server.tool("listar_planes", "Lista los planes de RevestIA (FREE, FREEMIUM, PREMIUM) y sus beneficios.", {}, async () => ok(Object.values(PLANS)));

/* ---------- Herramientas SUPERADMIN ---------- */
if (SCOPE === "admin") {
  server.tool("metricas_plataforma", "KPIs: comercios, MRR, ventas con RevestIA, usuarios que vieron y no compraron, leads.", {}, async () =>
    ok(await api("/admin/metrics")),
  );
  server.tool(
    "graficos_mensuales",
    "Series mensuales: ventas vs visualizaciones y nuevos comercios vs leads.",
    { months: z.number().int().min(3).max(12).optional() },
    async ({ months }) => ok(await api(`/admin/charts?months=${months ?? 6}`)),
  );
  server.tool(
    "listar_clientes",
    "Tabla de comercios B2B: usuarios, ventas, plan, vencimiento y estado de pago.",
    { buscar: z.string().optional() },
    async ({ buscar }) => ok(await api(`/admin/clients${buscar ? `?q=${encodeURIComponent(buscar)}` : ""}`)),
  );
  server.tool(
    "actualizar_cliente",
    "Cambia plan, estado de pago (PAID/DUE) o vencimiento de un comercio.",
    {
      id: z.string(),
      plan: z.enum(["FREE", "FREEMIUM", "PREMIUM"]).optional(),
      billingStatus: z.enum(["PAID", "DUE"]).optional(),
      planExpiresAt: z.string().optional().describe("Fecha ISO"),
    },
    async ({ id, ...data }) => ok(await api(`/admin/clients/${id}`, { method: "PATCH", body: JSON.stringify(data) })),
  );
  server.tool(
    "listar_emails",
    "Emails registrados: 'leads' (interesados de la landing) o 'endusers' (usuarios finales de los comercios).",
    { tipo: z.enum(["leads", "endusers"]) },
    async ({ tipo }) => ok(await api(`/admin/emails?type=${tipo}`)),
  );
  server.tool("listar_catalogo", "Catálogo maestro de revestimientos.", {}, async () => ok(await api("/admin/coatings")));
  server.tool(
    "crear_revestimiento_catalogo",
    "Agrega un revestimiento al catálogo maestro.",
    {
      name: z.string(),
      category: z.enum(CATEGORIES),
      material: z.string(),
      finish: z.string(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      pattern: z.enum(PATTERNS),
      m2PerBox: z.number().positive(),
      wastePct: z.number().min(0).max(50).optional(),
    },
    async (data) => ok(await api("/admin/coatings", { method: "POST", body: JSON.stringify(data) })),
  );
}

/* ---------- Herramientas CLIENTE (comercio) ---------- */
if (SCOPE === "client") {
  server.tool("mi_comercio", "Datos del comercio, uso del plan y KPIs.", {}, async () => ok(await api("/client/me")));
  server.tool("mis_revestimientos", "Revestimientos cargados con precio y stock.", {}, async () => ok(await api("/client/products")));
  server.tool(
    "actualizar_stock_precio",
    "Actualiza precio por caja y/o stock de un revestimiento.",
    { id: z.string(), pricePerBox: z.number().nonnegative().optional(), stockBoxes: z.number().int().nonnegative().optional() },
    async ({ id, ...data }) => ok(await api(`/client/products/${id}`, { method: "PATCH", body: JSON.stringify(data) })),
  );
  server.tool("mis_ventas", "Ventas realizadas con RevestIA.", {}, async () => ok(await api("/client/sales")));
  server.tool(
    "registrar_venta",
    "Registra una venta hecha con RevestIA y descuenta stock.",
    { productId: z.string(), boxes: z.number().int().positive(), endUserEmail: z.string().email().optional() },
    async (data) => ok(await api("/client/sales", { method: "POST", body: JSON.stringify(data) })),
  );
  server.tool("mis_usuarios", "Emails de los usuarios registrados y si compraron o no.", {}, async () => ok(await api("/client/end-users")));
}

await server.connect(new StdioServerTransport());
console.error(`RevestIA MCP listo (scope: ${SCOPE}, api: ${API})`);
