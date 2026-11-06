// Empaqueta la API (y los paquetes del monorepo) en un solo archivo JS
// para la función serverless de Vercel. Prisma queda externo: lo resuelve node_modules.
import { build } from "esbuild";

await build({
  entryPoints: ["src/app.ts"],
  outfile: "dist/app.mjs",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  sourcemap: true,
  external: ["@prisma/client", ".prisma/client"],
  // Algunas dependencias CommonJS usan require(): lo habilitamos dentro del bundle ESM
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: "info",
});
