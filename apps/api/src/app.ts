import express from "express";
import cors from "cors";
import { config } from "./config";
import { errorHandler } from "./lib/http";
import { publicRouter } from "./routes/public";
import { adminAuthRouter, clientAuthRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import { clientRouter } from "./routes/client";
import { widgetRouter } from "./routes/widget";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // El widget se embebe en webs de terceros: CORS abierto solo para /api/widget.
  app.use("/api/widget", cors(), widgetRouter);
  app.use(cors({ origin: config.corsOrigins }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "revestia-api" });
  });
  app.use("/api/public", publicRouter);

  // Superficies separadas: tokens con audiencia distinta, no intercambiables.
  app.use("/api/admin/auth", adminAuthRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/client/auth", clientAuthRouter);
  app.use("/api/client", clientRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });
  app.use(errorHandler);
  return app;
}
