import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "@revestia/ui/styles.css";
import "./admin.css";
import { api } from "./api";
import { AdminLayout } from "./Layout";
import { Login } from "./pages/Login";
import { Overview } from "./pages/Overview";
import { Charts } from "./pages/Charts";
import { Clients } from "./pages/Clients";
import { Emails } from "./pages/Emails";
import { Catalog } from "./pages/Catalog";

function RequireAdmin({ children }: { children: React.ReactNode }) {
  return api.getToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Overview />} />
          <Route path="graficos" element={<Charts />} />
          <Route path="clientes" element={<Clients />} />
          <Route path="emails" element={<Emails />} />
          <Route path="catalogo" element={<Catalog />} />
        </Route>
        {/* La app superadmin no tiene rutas de cliente */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
