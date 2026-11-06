import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "@revestia/ui/styles.css";
import "./client.css";
import { Landing } from "./pages/Landing";
import { Login, Register } from "./pages/Auth";
import { Widget } from "./pages/Widget";
import { PanelLayout } from "./pages/panel/Layout";
import { Overview } from "./pages/panel/Overview";
import { Products } from "./pages/panel/Products";
import { Sales } from "./pages/panel/Sales";
import { Users } from "./pages/panel/Users";
import { Payments } from "./pages/panel/Payments";
import { PlanPage } from "./pages/panel/Plan";
import { api } from "./api";

function RequireClient({ children }: { children: React.ReactNode }) {
  return api.getToken() ? <>{children}</> : <Navigate to="/ingresar" replace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/ingresar" element={<Login />} />
        <Route path="/w/:slug" element={<Widget />} />
        <Route
          path="/panel"
          element={
            <RequireClient>
              <PanelLayout />
            </RequireClient>
          }
        >
          <Route index element={<Overview />} />
          <Route path="revestimientos" element={<Products />} />
          <Route path="ventas" element={<Sales />} />
          <Route path="usuarios" element={<Users />} />
          <Route path="pagos" element={<Payments />} />
          <Route path="plan" element={<PlanPage />} />
        </Route>
        {/* La app de clientes no tiene rutas de superadmin: cualquier otra ruta vuelve al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
