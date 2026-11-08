import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Spinner, fmtMoney, fmtMonth } from "@revestia/ui";
import type { ChartRow } from "../api";
import { useLoad } from "../Layout";

export function Charts() {
  const [months, setMonths] = useState(6);
  const { data } = useLoad<ChartRow[]>(`/admin/charts?months=${months}`);
  const rows = (data ?? []).map((r) => ({ ...r, mes: fmtMonth(r.month) }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Gráficos</h1>
          <p>Comparativas mensuales.</p>
        </div>
        <div className="seg" style={{ display: "inline-flex", padding: 4, borderRadius: 999, background: "var(--surface-2)" }}>
          {[3, 6, 12].map((n) => (
            <button key={n} className={`btn btn-sm ${n === months ? "" : "btn-ghost"}`} style={{ border: 0 }} onClick={() => setMonths(n)}>
              {n} meses
            </button>
          ))}
        </div>
      </div>
      {!data ? (
        <Spinner />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}>
          <section className="card">
            <h3>Visualizaciones vs ventas</h3>
            <p className="muted">¿Cuántas visualizaciones terminan en compra cada mes?</p>
            <div className="chart-box">
              <ResponsiveContainer>
                <ComposedChart data={rows}>
                  <CartesianGrid vertical={false} stroke="#d9e4ee" />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} allowDecimals={false} />
                  <Tooltip formatter={(v: number, n: string) => [v, n]} />
                  <Legend iconType="circle" />
                  <Bar dataKey="visualizaciones" name="Visualizaciones" fill="#14a3a0" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="ventas" name="Ventas" fill="#1f6fb2" radius={[6, 6, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="card">
            <h3>Nuevos comercios vs leads</h3>
            <p className="muted">Crecimiento de la cartera B2B mes a mes.</p>
            <div className="chart-box">
              <ResponsiveContainer>
                <ComposedChart data={rows}>
                  <CartesianGrid vertical={false} stroke="#d9e4ee" />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} allowDecimals={false} />
                  <Tooltip />
                  <Legend iconType="circle" />
                  <Bar dataKey="leads" name="Leads (emails)" fill="#b9d3e8" radius={[6, 6, 0, 0]} />
                  <Line dataKey="nuevosComercios" name="Nuevos comercios" stroke="#0f2a44" strokeWidth={2.5} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="card" style={{ gridColumn: "1 / -1" }}>
            <h3>Monto vendido con RevestIA</h3>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="sheet" style={{ minWidth: 520 }}>
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th className="num">Visualizaciones</th>
                    <th className="num">Ventas</th>
                    <th className="num">Conversión</th>
                    <th className="num">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.month}>
                      <td>{r.mes}</td>
                      <td className="num">{r.visualizaciones}</td>
                      <td className="num">{r.ventas}</td>
                      <td className="num">{r.visualizaciones ? Math.round((r.ventas / r.visualizaciones) * 100) : 0}%</td>
                      <td className="num">{fmtMoney(r.montoVentas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
