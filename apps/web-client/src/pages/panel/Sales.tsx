import { useState, type FormEvent } from "react";
import { ApiError, Empty, Field, Kpi, Modal, Spinner, fmtDate, fmtMoney, fmtNum } from "@revestia/ui";
import { api, type Product } from "../../api";
import { useLoad, usePanel } from "./Layout";

interface Sale {
  id: string;
  boxes: number;
  areaM2: number;
  total: number;
  createdAt: string;
  product: { name: string } | null;
  endUser: { email: string } | null;
}

export function Sales() {
  const { me, reload: reloadMe } = usePanel();
  const { data, reload } = useLoad<Sale[]>("/client/sales");
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ventas con RevestIA</h1>
          <p>Cada venta que se concretó después de usar el visualizador o la calculadora.</p>
        </div>
        <button className="btn btn-accent" onClick={() => setOpen(true)}>+ Registrar venta</button>
      </div>
      <div className="kpis" style={{ marginBottom: 20 }}>
        <Kpi tone="accent" label="Veces que vendiste con RevestIA" value={fmtNum(me.kpis.salesCount)} />
        <Kpi label="Monto total" value={fmtMoney(me.kpis.salesTotal)} />
        <Kpi label="Ticket promedio" value={fmtMoney(me.kpis.salesCount ? me.kpis.salesTotal / me.kpis.salesCount : 0)} />
      </div>
      {!data ? (
        <Spinner />
      ) : !data.length ? (
        <Empty>Todavía no hay ventas registradas.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="sheet">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Revestimiento</th>
                <th>Cliente</th>
                <th className="num">m²</th>
                <th className="num">Cajas</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}>
                  <td>{fmtDate(s.createdAt)}</td>
                  <td>{s.product?.name ?? "—"}</td>
                  <td>{s.endUser?.email ?? <span className="muted">venta en local</span>}</td>
                  <td className="num">{s.areaM2.toFixed(1)}</td>
                  <td className="num">{s.boxes}</td>
                  <td className="num">{fmtMoney(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <SaleForm
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            reload();
            reloadMe();
          }}
        />
      )}
    </>
  );
}

function SaleForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { data: products } = useLoad<Product[]>("/client/products");
  const [productId, setProductId] = useState("");
  const [boxes, setBoxes] = useState(1);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const p = products?.find((x) => x.id === productId);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/client/sales", { productId, boxes, endUserEmail: email || undefined });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error");
    }
  };
  return (
    <Modal title="Registrar venta" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Field label="Revestimiento">
          <select required value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Elegí…</option>
            {products?.map((x) => (
              <option key={x.id} value={x.id}>{x.name} — stock {x.stockBoxes}</option>
            ))}
          </select>
        </Field>
        <Field label="Cajas vendidas">
          <input type="number" min={1} required value={boxes} onChange={(e) => setBoxes(Number(e.target.value))} />
        </Field>
        <Field label="Email del cliente (opcional)" hint="Si ya está registrado en tu widget, la venta queda asociada">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {p && <div className="alert alert-ok">Total: {fmtMoney(p.pricePerBox * boxes)} · se descuentan {boxes} cajas del stock</div>}
        {error && <div className="alert">{error}</div>}
        <button className="btn btn-accent">Guardar venta</button>
      </form>
    </Modal>
  );
}
