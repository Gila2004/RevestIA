# Arquitectura de RevestIA

## Vista general

```
                ┌───────────────────────┐        ┌───────────────────────┐
  Comercios ──▶ │ web-client  :5173     │        │ web-admin  :5174      │ ◀── Equipo RevestIA
  y usuarios    │ landing · panel ·     │        │ panorama · gráficos · │
  finales       │ widget /w/:slug       │        │ clientes · emails ·   │
                └──────────┬────────────┘        │ catálogo              │
                           │ token aud=client     └──────────┬────────────┘
                           │ token aud=widget                │ token aud=admin
                           ▼                                 ▼
                ┌──────────────────────────────────────────────────────┐
  Claude ─MCP─▶ │ API REST (Express)  :4000/api                         │
  (apps/mcp)    │ /public · /widget/:slug · /client/* · /admin/*        │
                └──────────────────────────┬───────────────────────────┘
                                           ▼
                                ┌────────────────────┐
                                │ Prisma → SQLite    │  (Postgres en prod)
                                └────────────────────┘
```

Es un monorepo con **npm workspaces**:

- `apps/` contiene lo que se despliega: dos webs, la API y el MCP.
- `packages/` contiene lo que se comparte: base de datos, dominio y UI.

## Separación Cliente / Superadmin

Desde la parte de cliente no se puede entrar a la de superadmin, ni al revés. Eso se garantiza en tres capas:

1. **Apps distintas.** Cada web tiene su propio build, puerto y origen. En producción van en dominios separados, por ejemplo `revestia.app` y `admin.revestia.app`. Ninguna de las dos contiene las rutas ni el código de la otra.
2. **Sesiones distintas.** Cada app guarda su token en su propio origen y con su propia clave, así que una sesión nunca se comparte entre ellas.
3. **API con audiencias.** Cada JWT lleva una audiencia: `admin`, `client` o `widget`. `requireAuth(audience)` rechaza con 401 cualquier token de otra audiencia o de otro rol. Los logins también están separados: `/api/admin/auth/login` solo acepta usuarios `SUPERADMIN` y `/api/client/auth/login` solo acepta `CLIENT`.

Además, todas las consultas del panel de cliente filtran por el `commerceId` del token, de modo que un comercio nunca ve datos de otro.

## Modelo de datos (`packages/db/prisma/schema.prisma`)

| Modelo | Para qué |
|---|---|
| `User` | Cuentas con login (`SUPERADMIN` o `CLIENT`) |
| `Commerce` | Cliente B2B: plan, vencimiento y estado de pago (`PAID` o `DUE`) |
| `Coating` | Catálogo maestro que administra el superadmin |
| `Product` | Revestimiento del comercio, con precio y stock propios. Puede venir de un `Coating` |
| `EndUser` | Usuario final del comercio. Se registra con email para poder usar el widget |
| `Visualization` | Cada uso del visualizador. Sirve para medir el consumo del plan y quién vio sin comprar |
| `Sale` | Venta hecha con RevestIA, ya sea desde el widget o cargada a mano |
| `PaymentMethod` | Medios de pago que acepta el comercio |
| `Lead` | Emails que se dejaron en la landing |
| `PageView` | Visitas a la landing, para el embudo y para medir quién entró y no se registró |

## Planes (`packages/shared`)

Los planes están definidos en código, en un solo lugar (`PLANS`), y los usan la landing, el panel, la API y el MCP. La API hace cumplir los límites:

- límite de visualizaciones por mes: el endpoint devuelve 402;
- límite de productos según el plan.

## API

| Prefijo | Auth | Contenido |
|---|---|---|
| `/api/public` | — | planes, leads, pageviews y calculadora |
| `/api/widget/:slug` | token `widget` (salvo GET y register) | info del comercio, registro por email, visualizar y comprar |
| `/api/client/auth` | — | login y registro de comercio |
| `/api/client/*` | token `client` | me, stats, plan, products, catalog, payment-methods, sales, end-users |
| `/api/admin/auth` | — | login superadmin |
| `/api/admin/*` | token `admin` | metrics, charts, clients, emails, coatings |

Todas las entradas se validan con **zod**. Los errores se responden siempre como `{ error, details? }`.

## MCP (`apps/mcp`)

El servidor MCP **no accede a la base de datos**: consume la API REST. Así hereda la misma autenticación, las mismas validaciones y la misma separación de roles. Las herramientas que expone dependen de `REVESTIA_SCOPE`:

- `admin`: `metricas_plataforma`, `graficos_mensuales`, `listar_clientes`, `actualizar_cliente`, `listar_emails`, `listar_catalogo`, `crear_revestimiento_catalogo`
- `client`: `mi_comercio`, `mis_revestimientos`, `actualizar_stock_precio`, `mis_ventas`, `registrar_venta`, `mis_usuarios`
- siempre disponibles: `estimar_cantidad`, `listar_planes`

## Frontend

- React 18, Vite y React Router. Gráficos con Recharts.
- `packages/ui` tiene los tokens de diseño en `styles.css`: paleta arena, terracota, carbón y salvia, con tipografías Fraunces e Inter. También tiene componentes base y el cliente HTTP. Si se cambia la paleta en `:root`, cambian las dos webs.
- Diseño responsive: en pantallas chicas la barra lateral pasa a un menú desplegable y las tablas tienen scroll horizontal propio.
- El widget del comercio se embebe con un `<iframe>` apuntando a `/w/:slug`. El panel de cada comercio le muestra el código listo para copiar.

## Despliegue sugerido

| Pieza | Dónde |
|---|---|
| web-client, web-admin | Hosting estático (Vercel, Netlify, Cloudflare Pages), un proyecto cada una |
| API | Render, Railway o Fly.io, con `DATABASE_URL` de Postgres y `JWT_SECRET` |
| MCP | Se ejecuta localmente junto al cliente MCP. También puede migrarse a transporte HTTP |
