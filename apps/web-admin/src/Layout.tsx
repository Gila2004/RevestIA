import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "@revestia/ui";
import { api } from "./api";

const NAV = [
  { to: "/", label: "Panorama", ico: "◧", end: true },
  { to: "/graficos", label: "Gráficos", ico: "▥" },
  { to: "/clientes", label: "Clientes B2B", ico: "▤" },
  { to: "/emails", label: "Emails registrados", ico: "✉" },
  { to: "/catalogo", label: "Catálogo maestro", ico: "▦" },
];

export function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const reload = useCallback(async () => setData(await api.get<T>(path)), [path]);
  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);
  return { data, reload, setData };
}

export function AdminLayout() {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <div className="shell theme-admin">
      <div className="topbar-mobile">
        <Logo size={22} tone="light" />
        <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Menú">☰</button>
      </div>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div>
          <Logo tone="light" />
          <div className="muted" style={{ fontSize: 12, marginTop: 6, letterSpacing: ".12em", textTransform: "uppercase" }}>Superadmin</div>
        </div>
        <nav onClick={() => setOpen(false)}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <span className="nav-ico">{n.ico}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: "#efe6da", borderColor: "rgba(255,255,255,.18)", width: "100%" }}
            onClick={() => {
              api.setToken(null);
              nav("/login");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
