# RevestIA

Plataforma B2B para comercios de revestimientos: sus clientes **ven cómo queda el ambiente** y **saben cuántas cajas comprar**, y el comercio guarda cada email y cada venta.

Son dos webs separadas, una API, una base de datos y un servidor MCP:

| Pieza | Carpeta | Puerto | Para quién |
|---|---|---|---|
| Web **Cliente** (landing + panel + widget) | `apps/web-client` | 5173 | Comercios y sus usuarios finales |
| Web **Superadmin** | `apps/web-admin` | 5174 | Equipo RevestIA |
| **API** REST | `apps/api` | 4000 | Las dos webs y el MCP |
| **MCP** (herramientas para IA) | `apps/mcp` | stdio | Claude u otros agentes |
| **Base de datos** (Prisma) | `packages/db` | — | API |
| Lógica de dominio compartida | `packages/shared` | — | Todos |
| Sistema de diseño compartido | `packages/ui` | — | Las dos webs |

La arquitectura está explicada en [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Puesta en marcha

Requisitos: Node.js 20 o superior.

```bash
cp .env.example .env        # opcional en desarrollo
npm run setup               # instala dependencias, crea la base SQLite y carga datos demo
npm run dev                 # levanta API + web cliente + web superadmin
```

- Cliente: http://localhost:5173 — panel en `/panel` y widget en `/w/<slug>`
- Superadmin: http://localhost:5174

Usuarios de demo (los crea `npm run db:seed`):

| Rol | Email | Contraseña |
|---|---|---|
| Superadmin | admin@revestia.app | RevestIA2026! |
| Cliente (comercio) | demo@ceramicasdelsur.com | Demo2026! |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | API + las dos webs en paralelo |
| `npm run dev:api` / `dev:client` / `dev:admin` | Cada pieza por separado |
| `npm run db:push` | Aplica `schema.prisma` a la base |
| `npm run db:seed` | Borra y recarga los datos demo |
| `npm run db:studio` | Abre Prisma Studio para ver la base |
| `npm run mcp` | Inicia el servidor MCP (stdio) |
| `npm run build` | Compila las dos webs para producción |
| `npm run typecheck` | Chequeo de tipos de todo el monorepo |

## Conectar el MCP a Claude

Agregá esto a la configuración MCP de Claude Desktop o Claude Code (ajustá la ruta):

```json
{
  "mcpServers": {
    "revestia-admin": {
      "command": "npx",
      "args": ["tsx", "C:/ruta/al/proyecto/apps/mcp/src/index.ts"],
      "env": {
        "REVESTIA_API_URL": "http://localhost:4000/api",
        "REVESTIA_SCOPE": "admin",
        "REVESTIA_EMAIL": "admin@revestia.app",
        "REVESTIA_PASSWORD": "RevestIA2026!"
      }
    }
  }
}
```

Con `REVESTIA_SCOPE=client` y las credenciales de un comercio, el MCP expone las herramientas del comercio (stock, ventas, usuarios).

## Publicar en Vercel

Hay una guía paso a paso en [docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md). Son 3 proyectos de Vercel (API, web cliente y web superadmin) y una base Postgres gratuita en Neon.

En desarrollo se usa SQLite. Para producción, el esquema de Postgres se genera automáticamente desde el mismo `schema.prisma` (`npm run pg:schema -w @revestia/db`).

## Pendientes antes de producción
- Integrar la pasarela de cobro de suscripciones (Mercado Pago / Stripe). Hoy, al cambiar a un plan pago, el comercio queda en estado "Debe" hasta que el superadmin lo marca como pagado.
- Ajustar precios y límites de los planes en `packages/shared/src/index.ts`.
- Reemplazar la escena ilustrada del hero por un video o fotos reales si se quiere.
