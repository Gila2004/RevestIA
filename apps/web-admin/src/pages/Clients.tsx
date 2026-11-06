import { useMemo, useState } from "react";
import { PLAN_CODES } from "@revestia/shared";
import { Badge, Spinner, downloadCsv, fmtDate, fmtNum } from "@revestia/ui";
import { api, type ClientRow } from "../api";
import { useLoad } from "../Layout";

type SortKey = "name" | "users" | "sales" | "plan" | "planExpiresAt" | "billingStatus";

/** Planilla de clientes B2B: editable en línea (plan, vencimiento y estado de pago). */
export function Clients() {
  const { data, setData } = useLoad<ClientRow[]>("/admin/clients");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "PAID" | "DUE">("");
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "sales", dir: -1 });

  const rows = useMemo(() => {
    const list = (data ?? []).filter(
      (c) => (!status || c.billingStatus === status) && (c.name.toLowerCase().includes(q.toLowerCase()) || c.contactEmail.includes(q.toLowerCase())),
    );
    return [...list].sort((a, b) => {
      const av = a[sort.k] ?? "";
      const bv = b[sort.k] ?? "";
      return (av > bv ? 1 : av < bv ? -1 : 0) * sort.dir;
    });
  }, [data, q, status, sort]);

  const update = async (c: ClientRow, change: Partial<ClientRow>) => {
    setData((d) => d?.map((x) => (x.id === c.id ? { ...x, ...change } : x)) ?? null);
    await api.patch(`/admin/clients/${c.id}`, change);
  };

  const th = (k: SortKey, label: string, num = false) => (
    <th data-sort className={num ? "num" : ""} onClick={() => setSort({ k, dir: sort.k === k ? (sort.dir === 1 ? -1 : 1) : -1 })} aria-sort={sort.k === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      {label} {sort.k === k ? (sort.dir === 1 ? "▲" : "▼") : ""}
    </th>
  );

  const expired = (d: string | null) => d && new Date(d) < new Date();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clientes B2B</h1>
          <p>Comercios que usan RevestIA. Editá plan, vencimiento y estado de pago directamente en la tabla.</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() =>
            downloadCsv("clientes-revestia.csv", rows.map((c) => ({ cliente: c.name, email: c.contactEmail, usuarios: c.users, ventas_con_revestia: c.sales, plan: c.plan, vencimiento: c.planExpiresAt?.slice(0, 10) ?? "", estado: c.billingStatus === "PAID" ? "Pagado" : "Debe" })))
          }
        >
          ⤓ Exportar CSV
        </button>
      </div>
      <div className="toolbar">
        <input className="input" style={{ maxWidth: 300 }} placeholder="Buscar cliente o email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="">Todos los estados</option>
          <option value="PAID">Pagado</option>
          <option value="DUE">Debe</option>
        </select>
        <span className="muted" style={{ fontSize: 13 }}>{rows.length} clientes</span>
      </div>
      {!data ? (
        <Spinner />
      ) : (
        <div className="table-wrap">
          <table className="sheet">
            <thead>
              <tr>
                {th("name", "Cliente")}
                {th("users", "Usuarios", true)}
                {th("sales", "Ventas con RevestIA", true)}
                {th("plan", "Plan")}
                {th("planExpiresAt", "Vencimiento")}
                {th("billingStatus", "Estado")}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                    <br />
                    <small className="muted">{c.contactEmail}</small>
                  </td>
                  <td className="num">{fmtNum(c.users)}</td>
                  <td className="num">{fmtNum(c.sales)}</td>
                  <td>
                    <select value={c.plan} onChange={(e) => update(c, { plan: e.target.value as ClientRow["plan"] })} aria-label={`Plan de ${c.name}`}>
                      {PLAN_CODES.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </td>
                  <td>
                    {c.plan === "FREE" ? (
                      <span className="muted">—</span>
                    ) : (
                      <input
                        type="date"
                        className="input"
                        style={{ minHeight: 32, padding: "2px 8px", width: 150, borderColor: expired(c.planExpiresAt) ? "var(--warn)" : undefined }}
                        value={c.planExpiresAt?.slice(0, 10) ?? ""}
                        onChange={(e) => update(c, { planExpiresAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        aria-label={`Vencimiento de ${c.name}`}
                        title={fmtDate(c.planExpiresAt)}
                      />
                    )}
                  </td>
                  <td>
                    <button
                      className="icon-btn"
                      style={{ width: "auto" }}
                      onClick={() => update(c, { billingStatus: c.billingStatus === "PAID" ? "DUE" : "PAID" })}
                      title="Click para cambiar"
                    >
                      {c.billingStatus === "PAID" ? <Badge tone="ok">● Pagado</Badge> : <Badge tone="warn">● Debe</Badge>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="tfoot">
              <tr>
                <td>Total</td>
                <td className="num">{fmtNum(rows.reduce((a, c) => a + c.users, 0))}</td>
                <td className="num">{fmtNum(rows.reduce((a, c) => a + c.sales, 0))}</td>
                <td colSpan={2}></td>
                <td>{rows.filter((c) => c.billingStatus === "DUE").length} deben</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </>
  );
}
