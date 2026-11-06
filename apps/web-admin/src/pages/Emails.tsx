import { useMemo, useState } from "react";
import { Badge, Spinner, downloadCsv, fmtDate } from "@revestia/ui";
import { useLoad } from "../Layout";

interface EmailRow {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  status: string;
  visualizations?: number;
  createdAt: string;
}

const TONE: Record<string, "ok" | "warn" | "accent"> = { CONVERTED: "ok", NEW: "accent", "COMPRÓ": "ok", "NO COMPRÓ": "warn" };
const LABEL: Record<string, string> = { CONVERTED: "Creó cuenta", NEW: "Sin cuenta" };

export function Emails() {
  const [type, setType] = useState<"leads" | "endusers">("leads");
  const { data } = useLoad<EmailRow[]>(`/admin/emails?type=${type}`);
  const [q, setQ] = useState("");
  const rows = useMemo(() => (data ?? []).filter((r) => `${r.email} ${r.name ?? ""} ${r.company ?? ""}`.toLowerCase().includes(q.toLowerCase())), [data, q]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Emails registrados</h1>
          <p>Interesados que dejaron su email en la landing y usuarios finales registrados en los comercios.</p>
        </div>
        <button className="btn btn-ghost" disabled={!rows.length} onClick={() => downloadCsv(`emails-${type}.csv`, rows.map(({ id: _id, ...r }) => r))}>
          ⤓ Exportar CSV
        </button>
      </div>
      <div className="toolbar">
        <div className="row" style={{ gap: 6 }}>
          <button className={`btn btn-sm ${type === "leads" ? "" : "btn-ghost"}`} onClick={() => setType("leads")}>Leads landing</button>
          <button className={`btn btn-sm ${type === "endusers" ? "" : "btn-ghost"}`} onClick={() => setType("endusers")}>Usuarios de comercios</button>
        </div>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="muted" style={{ fontSize: 13 }}>{rows.length} emails</span>
      </div>
      {!data ? (
        <Spinner />
      ) : (
        <div className="table-wrap">
          <table className="sheet">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>{type === "leads" ? "Empresa" : "Comercio"}</th>
                {type === "endusers" && <th className="num">Visualizaciones</th>}
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                  <td>{r.name ?? "—"}</td>
                  <td>{r.company ?? "—"}</td>
                  {type === "endusers" && <td className="num">{r.visualizations}</td>}
                  <td><Badge tone={TONE[r.status] ?? "neutral"}>{LABEL[r.status] ?? r.status}</Badge></td>
                  <td>{fmtDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
