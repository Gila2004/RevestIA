import { Kpi, Spinner, fmtMoney, fmtNum, fmtPct, fmtUsd } from "@revestia/ui";
import type { Metrics } from "../api";
import { useLoad } from "../Layout";

const PLAN_COLORS: Record<string, string> = { FREE: "#d9cfc1", FREEMIUM: "#7c8c6e", PREMIUM: "#b5653b" };

export function Overview() {
  const { data: m } = useLoad<Metrics>("/admin/metrics");
  if (!m) return <Spinner />;

  const funnel = [
    { label: "Visitaron la landing", v: m.landingVisitors },
    { label: "Dejaron su email", v: m.leads },
    { label: "Comercios registrados", v: m.commerces },
    { label: "Comercios con plan pago", v: m.payingCommerces },
  ];
  const max = Math.max(1, ...funnel.map((f) => f.v));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Panorama</h1>
          <p>Métricas generales de RevestIA en tiempo real.</p>
        </div>
      </div>

      <div className="kpis">
        <Kpi tone="accent" label="MRR (cobrado)" value={fmtUsd(m.mrrUsd)} hint={`${m.payingCommerces} comercios con plan pago`} />
        <Kpi label="Ventas con RevestIA" value={fmtNum(m.salesCount)} hint={`${fmtMoney(m.salesTotal)} · ${m.salesThisMonth} este mes`} />
        <Kpi label="Comercios" value={fmtNum(m.commerces)} hint={m.commercesDue ? `${m.commercesDue} con pago pendiente` : "todos al día"} />
        <Kpi tone="sage" label="Conversión usuario → compra" value={fmtPct(m.conversionRate)} hint={`${fmtNum(m.endUsers)} usuarios registrados`} />
      </div>

      <div className="kpis" style={{ marginTop: 14 }}>
        <Kpi tone="warn" label="Entraron y no compraron" value={fmtNum(m.endUsersNoPurchase)} hint="usuarios finales que visualizaron sin comprar" />
        <Kpi tone="warn" label="Leads sin convertir" value={fmtNum(m.leadsNotConverted)} hint="dejaron email en la landing, sin cuenta" />
        <Kpi label="Visualizaciones" value={fmtNum(m.visualizations)} hint="ambientes generados" />
        <Kpi label="Visitantes landing" value={fmtNum(m.landingVisitors)} hint="visitantes únicos" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", marginTop: 20 }}>
        <section className="card">
          <h3>Embudo comercial</h3>
          <p className="muted">De la visita al plan pago.</p>
          <div className="funnel">
            {funnel.map((f, i) => (
              <div className="funnel-row" key={f.label}>
                <span>{f.label}</span>
                <div className="funnel-bar" style={{ width: `${Math.max(4, (f.v / max) * 100)}%`, opacity: 1 - i * 0.18 }} />
                <strong>{fmtNum(f.v)}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h3>Distribución por plan</h3>
          <p className="muted">{m.commerces} comercios en total.</p>
          <div className="plan-split" role="img" aria-label="Distribución de comercios por plan">
            {Object.entries(m.byPlan).map(([p, n]) => (
              <i key={p} style={{ width: `${(n / Math.max(1, m.commerces)) * 100}%`, background: PLAN_COLORS[p] }} />
            ))}
          </div>
          <div className="legend">
            {Object.entries(m.byPlan).map(([p, n]) => (
              <span key={p}>
                <i style={{ background: PLAN_COLORS[p] }} /> {p} · <strong>{n}</strong>
              </span>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
