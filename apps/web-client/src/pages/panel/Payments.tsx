import { useState, type FormEvent } from "react";
import { PAYMENT_TYPES } from "@revestia/shared";
import { ApiError, Badge, Empty, Field, Modal, Spinner } from "@revestia/ui";
import { api } from "../../api";
import { useLoad } from "./Layout";

interface PM {
  id: string;
  type: string;
  label: string;
  details: string | null;
  active: boolean;
}
const LABEL: Record<string, string> = { MERCADOPAGO: "Mercado Pago", TRANSFERENCIA: "Transferencia", TARJETA: "Tarjeta", EFECTIVO: "Efectivo", OTRO: "Otro" };
const ICON: Record<string, string> = { MERCADOPAGO: "◎", TRANSFERENCIA: "⇄", TARJETA: "▭", EFECTIVO: "$", OTRO: "•" };

export function Payments() {
  const { data, reload } = useLoad<PM[]>("/client/payment-methods");
  const [open, setOpen] = useState(false);

  const toggle = async (p: PM) => {
    await api.patch(`/client/payment-methods/${p.id}`, { active: !p.active });
    reload();
  };
  const remove = async (p: PM) => {
    if (!confirm(`¿Eliminar "${p.label}"?`)) return;
    await api.del(`/client/payment-methods/${p.id}`);
    reload();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Medios de pago</h1>
          <p>Los medios activos se muestran a tus clientes al momento de comprar.</p>
        </div>
        <button className="btn btn-accent" onClick={() => setOpen(true)}>+ Agregar medio</button>
      </div>
      {!data ? (
        <Spinner />
      ) : !data.length ? (
        <Empty>No cargaste medios de pago todavía.</Empty>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {data.map((p) => (
            <article key={p.id} className="card stack" style={{ gap: 10, opacity: p.active ? 1 : 0.6 }}>
              <div className="spread">
                <span className="row" style={{ gap: 10 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent-strong)", display: "grid", placeItems: "center", fontSize: 18 }}>{ICON[p.type]}</span>
                  <strong>{p.label}</strong>
                </span>
                {p.active ? <Badge tone="ok">Activo</Badge> : <Badge>Inactivo</Badge>}
              </div>
              <span className="muted" style={{ fontSize: 13 }}>{LABEL[p.type]}{p.details ? ` · ${p.details}` : ""}</span>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => toggle(p)}>{p.active ? "Desactivar" : "Activar"}</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Eliminar</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {open && <PMForm onClose={() => setOpen(false)} onSaved={() => { setOpen(false); reload(); }} />}
    </>
  );
}

function PMForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<string>("MERCADOPAGO");
  const [label, setLabel] = useState("Mercado Pago");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/client/payment-methods", { type, label, details: details || null });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error");
    }
  };
  return (
    <Modal title="Nuevo medio de pago" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Field label="Tipo">
          <select value={type} onChange={(e) => { setType(e.target.value); setLabel(LABEL[e.target.value]); }}>
            {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{LABEL[t]}</option>)}
          </select>
        </Field>
        <Field label="Nombre visible"><input required value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
        <Field label="Detalle (opcional)" hint="Ej: alias, cuotas sin interés, descuento por efectivo. No cargues datos sensibles.">
          <input value={details} onChange={(e) => setDetails(e.target.value)} />
        </Field>
        {error && <div className="alert">{error}</div>}
        <button className="btn btn-accent">Guardar</button>
      </form>
    </Modal>
  );
}
