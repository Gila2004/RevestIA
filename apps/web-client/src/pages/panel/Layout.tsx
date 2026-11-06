import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useOutletContext } from "react-router-dom";
import { Badge, Logo, Spinner } from "@revestia/ui";
import { api, type Me } from "../../api";

interface PanelCtx {
  me: Me;
  reload: () => Promise<void>;
}
export const usePanel = () => useOutletContext<PanelCtx>();

/** Carga simple con estado de recarga. */
export function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setData(await api.get<T>(path));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [path]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { data, error, reload, setData };
}

const NAV = [
  { to: "/panel", label: "Resumen", ico: "◧", end: true },
  { to: "/panel/revestimientos", label: "Revestimientos", ico: "▦" },
  { to: "/panel/ventas", label: "Ventas con RevestIA", ico: "↗" },
  { to: "/panel/usuarios", label: "Usuarios y emails", ico: "◉" },
  { to: "/panel/pagos", label: "Medios de pago", ico: "◈" },
  { to: "/panel/plan", label: "Mi plan", ico: "★" },
];

export function PanelLayout() {
  const nav = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const reload = useCallback(async () => setMe(await api.get<Me>("/client/me")), []);
  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  const logout = () => {
    api.setToken(null);
    nav("/ingresar");
  };

  if (!me) return <Spinner />;
  return (
    <div className="shell">
      <div className="topbar-mobile">
        <Logo size={22} />
        <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Menú">
          ☰
        </button>
      </div>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Logo />
        <div>
          <strong>{me.commerce.name}</strong>
          <div className="row" style={{ marginTop: 6, gap: 6 }}>
            <Badge tone="accent">{me.usage.plan.name}</Badge>
            {me.commerce.billingStatus === "DUE" && <Badge tone="warn">Pago pendiente</Badge>}
          </div>
        </div>
        <nav onClick={() => setOpen(false)}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <span className="nav-ico">{n.ico}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot stack" style={{ gap: 8 }}>
          <a className="muted" href={`/w/${me.commerce.slug}`} target="_blank" rel="noreferrer">
            Ver mi widget ↗
          </a>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet context={{ me, reload } satisfies PanelCtx} />
      </main>
    </div>
  );
}
