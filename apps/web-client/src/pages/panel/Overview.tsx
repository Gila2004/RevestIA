import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Kpi, fmtMoney, fmtMonth, fmtNum } from "@revestia/ui";
import { useLoad, usePanel } from "./Layout";

export function Overview() {
  const { me } = usePanel();
  const { data: stats } = useLoad<{ month: string; ventas: number; visualizaciones: number }[]>("/client/stats");
  const [copied, setCopied] = useState(false);
  const url = `${location.origin}/w/${me.commerce.slug}`;
  const snippet = `<iframe src="${url}" width="100%" height="760" style="border:0;border-radius:16px" loading="lazy" title="RevestIA"></iframe>`;
  const left = me.usage.visualizationsLeft;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hola, {me.commerce.name}</h1>
          <p>Así viene RevestIA en tu comercio.</p>
        </div>
      </div>

      <div className="kpis">
        <Kpi tone="accent" label="Ventas con RevestIA" value={fmtNum(me.kpis.salesCount)} hint={fmtMoney(me.kpis.salesTotal)} />
        <Kpi label="Usuarios registrados" value={fmtNum(me.kpis.endUsers)} hint="emails guardados" />
        <Kpi tone="warn" label="Vieron y no compraron" value={fmtNum(me.kpis.endUsersNoPurchase)} hint="oportunidades para recontactar" />
        <Kpi tone="sage" label="Visualizaciones este mes" value={fmtNum(me.usage.visualizationsThisMonth)} hint={left == null ? "ilimitadas" : `te quedan ${left}`} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", marginTop: 20 }}>
        <section className="card">
          <h3>Visualizaciones vs ventas</h3>
          <p className="muted">Últimos 6 meses</p>
          <div className="chart-box">
            <ResponsiveContainer>
              <BarChart data={(stats ?? []).map((s) => ({ ...s, mes: fmtMonth(s.month) }))} barGap={4}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={32} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }} />
                <Legend iconType="circle" />
                <Bar dataKey="visualizaciones" name="Visualizaciones" fill="#7c8c6e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="ventas" name="Ventas" fill="#b5653b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card stack">
          <div>
            <h3>Agregá RevestIA a tu web</h3>
            <p className="muted" style={{ margin: 0 }}>
              Pegá este código donde quieras que aparezca el visualizador. Tus clientes se registran con su email para usarlo.
            </p>
          </div>
          <div className="code">{snippet}</div>
          <div className="row">
            <button
              className="btn btn-accent btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(snippet);
                setCopied(true);
              }}
            >
              {copied ? "¡Copiado!" : "Copiar código"}
            </button>
            <a className="btn btn-ghost btn-sm" href={url} target="_blank" rel="noreferrer">
              Probar widget
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
