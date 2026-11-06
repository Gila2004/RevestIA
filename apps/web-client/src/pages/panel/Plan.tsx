import { useState } from "react";
import { PLANS, type PlanCode } from "@revestia/shared";
import { Badge, fmtDate } from "@revestia/ui";
import { api } from "../../api";
import { usePanel } from "./Layout";

function Meter({ label, used, max }: { label: string; used: number; max: number | null }) {
  const pct = max == null ? 8 : Math.min(100, (used / Math.max(1, max)) * 100);
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="spread" style={{ fontSize: 14 }}>
        <span>{label}</span>
        <strong>{max == null ? `${used} · ilimitado` : `${used} / ${max}`}</strong>
      </div>
      <div className="meter"><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function PlanPage() {
  const { me, reload } = usePanel();
  const [busy, setBusy] = useState<PlanCode | null>(null);
  const current = me.usage.plan;

  const change = async (plan: PlanCode) => {
    setBusy(plan);
    await api.post("/client/plan", { plan });
    await reload();
    setBusy(null);
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Mi plan</h1>
          <p>Uso del mes y opciones para crecer.</p>
        </div>
      </div>
      <section className="card stack" style={{ marginBottom: 24 }}>
        <div className="spread">
          <div>
            <span className="eyebrow">Plan actual</span>
            <h2 style={{ margin: "4px 0 0" }}>{current.name}</h2>
          </div>
          <div className="row">
            {me.commerce.billingStatus === "DUE" ? <Badge tone="warn">Pago pendiente</Badge> : <Badge tone="ok">Al día</Badge>}
            {me.commerce.planExpiresAt && <span className="muted">Vence {fmtDate(me.commerce.planExpiresAt)}</span>}
          </div>
        </div>
        <Meter label="Visualizaciones este mes" used={me.usage.visualizationsThisMonth} max={current.visualizationsPerMonth} />
        <Meter label="Revestimientos cargados" used={me.usage.products} max={current.maxProducts} />
      </section>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {Object.values(PLANS).map((p) => (
          <article key={p.code} className="card stack" style={p.code === current.code ? { borderColor: "var(--accent)", boxShadow: "0 0 0 3px var(--accent-soft)" } : undefined}>
            <div className="spread">
              <h3 style={{ margin: 0 }}>{p.name}</h3>
              <strong>{p.priceMonthlyUsd ? `USD ${p.priceMonthlyUsd}/mes` : "Gratis"}</strong>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--ink-2)", fontSize: 14 }}>
              {p.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            {p.code === current.code ? (
              <Badge tone="accent">Tu plan</Badge>
            ) : (
              <button className="btn btn-accent btn-sm" disabled={!!busy} onClick={() => change(p.code)}>
                {busy === p.code ? "Cambiando…" : `Cambiar a ${p.name}`}
              </button>
            )}
          </article>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 16 }}>
        Al pasar a un plan pago, la suscripción queda pendiente hasta confirmar el pago.
      </p>
    </>
  );
}
