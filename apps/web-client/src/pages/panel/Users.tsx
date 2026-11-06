import { useMemo, useState } from "react";
import { Badge, Empty, Spinner, downloadCsv, fmtDate } from "@revestia/ui";
import { useLoad, usePanel } from "./Layout";

interface EndUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  sales: number;
  visualizations: number;
}

export function Users() {
  const { me } = usePanel();
  const { data } = useLoad<EndUser[]>("/client/end-users");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "buyers" | "nobuy">("all");

  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (u) =>
          (filter === "all" || (filter === "buyers" ? u.sales > 0 : u.sales === 0)) &&
          (u.email.includes(q.toLowerCase()) || (u.name ?? "").toLowerCase().includes(q.toLowerCase())),
      ),
    [data, q, filter],
  );
  const canExport = me.usage.plan.code === "PREMIUM";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Usuarios y emails</h1>
          <p>Para usar RevestIA, cada persona se registra con su email. Acá los tenés a todos.</p>
        </div>
        <button
          className="btn btn-ghost"
          disabled={!canExport || !rows.length}
          title={canExport ? "" : "Disponible en el plan Premium"}
          onClick={() =>
            downloadCsv("usuarios-revestia.csv", rows.map((u) => ({ email: u.email, nombre: u.name ?? "", registrado: fmtDate(u.createdAt), visualizaciones: u.visualizations, compras: u.sales })))
          }
        >
          ⤓ Exportar CSV {!canExport && "· Premium"}
        </button>
      </div>
      <div className="row" style={{ marginBottom: 16 }}>
        <input className="input" style={{ maxWidth: 320 }} placeholder="Buscar email o nombre…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="seg">
          {(["all", "buyers", "nobuy"] as const).map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {f === "all" ? "Todos" : f === "buyers" ? "Compraron" : "No compraron"}
            </button>
          ))}
        </div>
      </div>
      {!data ? (
        <Spinner />
      ) : !rows.length ? (
        <Empty>No hay usuarios para mostrar.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="sheet">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Registro</th>
                <th className="num">Visualizaciones</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td><a href={`mailto:${u.email}`}>{u.email}</a></td>
                  <td>{u.name ?? "—"}</td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td className="num">{u.visualizations}</td>
                  <td>{u.sales > 0 ? <Badge tone="ok">Compró ({u.sales})</Badge> : <Badge tone="warn">No compró</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
