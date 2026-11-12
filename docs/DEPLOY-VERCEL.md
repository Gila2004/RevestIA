# Publicar RevestIA en Vercel (gratis)

Del mismo repositorio salen **3 proyectos de Vercel**, más una base de datos **Neon** (Postgres, plan gratuito):

| Proyecto Vercel | Root Directory | Qué es |
|---|---|---|
| `revestia-api` | `apps/api` | API (función serverless) + base Neon |
| `revestia` | `apps/web-client` | Web de clientes: landing, panel y widget |
| `revestia-admin` | `apps/web-admin` | Web superadmin |

Los nombres son sugeridos. Si Vercel te asigna otro dominio, usá el que te dé.
Hay que hacerlos **en este orden**, porque las webs necesitan la URL de la API.

---

## 1. Proyecto de la API

1. Entrá a https://vercel.com y logueate con GitHub.
2. Hacé click en **Add New… → Project** y después en **Import** sobre `Gila2004/RevestIA`.
3. En la pantalla de configuración:
   - **Project Name:** `revestia-api`
   - **Root Directory:** hacé click en *Edit* y elegí `apps/api`.
   - **Framework Preset:** `Other`. El resto ya lo define `apps/api/vercel.json`.
4. Abrí **Environment Variables** y agregá estas tres:

   | Nombre | Valor |
   |---|---|
   | `JWT_SECRET` | Un texto largo y aleatorio (abajo te explico cómo generarlo) |
   | `SEED_ADMIN_EMAIL` | El email con el que vas a entrar al superadmin |
   | `SEED_ADMIN_PASSWORD` | Una contraseña fuerte para el superadmin |
   | `DEMO_ADMIN_EMAIL` | *(Opcional)* Email de un superadmin extra para demos |
   | `DEMO_ADMIN_PASSWORD` | *(Opcional)* Contraseña de ese superadmin de demo |
   | `DEMO_CLIENT_EMAIL` | *(Opcional)* Email de una cuenta de **cliente** para demos |
   | `DEMO_CLIENT_PASSWORD` | *(Opcional)* Contraseña de esa cuenta de cliente |

   El superadmin y las cuentas de demo se crean o actualizan **en cada deploy** a partir de estas variables (`packages/db/prisma/ensure-accounts.ts`). Para cambiar un usuario o una contraseña, editá la variable y hacé **Redeploy**. Las credenciales nunca se guardan en el repositorio. La cuenta de cliente entra al comercio demo `ceramicas-del-sur`; para usar otro, definí `DEMO_CLIENT_COMMERCE` con su slug.

   Para generar `JWT_SECRET`, ejecutá esto en una terminal y copiá el resultado:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
5. Hacé click en **Deploy**. **Este primer deploy va a fallar** porque todavía no hay base de datos. Es normal.

### Crear la base de datos (Neon)

6. Dentro del proyecto `revestia-api`, andá a la pestaña **Storage → Create Database → Neon (Serverless Postgres)**.
7. Elegí el plan **Free** y la región más cercana (por ejemplo `Washington, D.C. (iad1)` o São Paulo, si aparece). Hacé click en **Create** y aceptá conectarla al proyecto `revestia-api`.
   En **Custom Prefix** escribí `DATABASE`: así se crean `DATABASE_URL` y `DATABASE_URL_UNPOOLED`, que son las que usa la app (con el prefijo por defecto, `STORAGE`, el build falla).
8. Andá a **Deployments**, abrí el menú **⋯** del último deploy y elegí **Redeploy**.

Durante el build pasa esto:
- Se crean las tablas en Neon.
- Si la base está vacía, se cargan los datos demo con **tu** usuario superadmin.

Si la base ya tiene datos, no se borra nada.

9. Para verificar, abrí `https://revestia-api.vercel.app/api/health` (con tu dominio). Tiene que responder `{"ok":true,...}`.

---

## 2. Web de clientes

1. Hacé click en **Add New… → Project** e importá otra vez `Gila2004/RevestIA`.
2. Configurá:
   - **Project Name:** `revestia`
   - **Root Directory:** `apps/web-client`
   - **Framework Preset:** `Vite`
3. Agregá esta variable de entorno:

   | Nombre | Valor |
   |---|---|
   | `VITE_API_URL` | `https://revestia-api.vercel.app/api` (la URL de tu API **con** `/api` al final) |
   | `VITE_ADMIN_URL` | `https://revestia-admin.vercel.app` (la web superadmin; la usa el enlace oculto del pie de la bienvenida) |

4. Hacé click en **Deploy**.

## 3. Web superadmin

Repetí los mismos pasos del punto 2 con estos datos:
- **Project Name:** `revestia-admin`
- **Root Directory:** `apps/web-admin`
- La misma variable `VITE_API_URL`.

---

## 4. Autorizar las webs en la API (CORS)

La API solo acepta pedidos que vengan de las dos webs. Para habilitarlas:

1. Entrá al proyecto `revestia-api`, después a **Settings → Environment Variables**, y agregá:

   | Nombre | Valor |
   |---|---|
   | `CLIENT_APP_URL` | `https://revestia.vercel.app` (sin `/` al final) |
   | `ADMIN_APP_URL` | `https://revestia-admin.vercel.app` |

   Si después sumás un dominio propio, ponelo separado por coma. Por ejemplo: `https://revestia.vercel.app,https://revestia.com.ar`.
2. Hacé **Redeploy** de `revestia-api`.

¡Listo! A partir de ahora, cada `git push` a `main` vuelve a publicar los tres proyectos automáticamente.

---

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| El build de la API falla con `Environment variable not found: DATABASE_URL` | Falta conectar Neon al proyecto (paso 6) o hacer el redeploy |
| El build falla con `Definí SEED_ADMIN_PASSWORD` | Falta esa variable en el proyecto de la API |
| El build no encuentra `vercel.json` o compila otra cosa | Al importar, Vercel puede proponer `apps` como Root Directory: tiene que ser `apps/api`, `apps/web-client` o `apps/web-admin` |
| "Redeploy" no hace nada | Vercel puede pedir un código que manda por email (*Send code*) antes de publicar a mano |
| Las webs cargan, pero el login dice "Error de conexión" | `VITE_API_URL` está mal (le falta `/api` o tiene un error de tipeo), o falta `CLIENT_APP_URL` / `ADMIN_APP_URL` en la API. Después de cambiar una variable siempre hay que hacer **Redeploy** |
| `Cannot find module` en el build | En **Settings → Build & Deployment**, revisá que esté activado *Include files outside the root directory in the Build Step* |
| Una página da 404 al recargarla | Revisá que `vercel.json` esté dentro de la carpeta de esa web |

## Límites del plan gratuito

- **Vercel Hobby** es para uso personal y no comercial. Cuando RevestIA empiece a cobrar, conviene pasar a Pro.
- **Neon Free** incluye 0,5 GB de almacenamiento. La base se "duerme" cuando no se usa, así que la primera consulta después de un rato puede tardar 1 o 2 segundos.
