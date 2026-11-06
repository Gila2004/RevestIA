import { useState, type FormEvent } from "react";
import { CATEGORIES, PATTERNS } from "@revestia/shared";
import { ApiError, Badge, Empty, Field, Modal, Spinner, fmtMoney } from "@revestia/ui";
import { api, type Product } from "../../api";
import { useLoad, usePanel } from "./Layout";

interface Coating {
  id: string;
  name: string;
  category: string;
  color: string;
  pattern: Product["pattern"];
  m2PerBox: number;
  wastePct: number;
}

const EMPTY = { coatingId: null as string | null, name: "", sku: "", category: "PISO", color: "#c8b8a6", pattern: "tile" as Product["pattern"], m2PerBox: 1.44, wastePct: 10, pricePerBox: 0, stockBoxes: 0, active: true };
const PATTERN_LABEL: Record<string, string> = { tile: "Cerámico", plank: "Tablas", stone: "Piedra", mosaic: "Venecita" };

export function Products() {
  const { me, reload: reloadMe } = usePanel();
  const { data, reload } = useLoad<Product[]>("/client/products");
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  const patch = async (p: Product, change: Partial<Product>) => {
    await api.patch(`/client/products/${p.id}`, change);
    reload();
  };
  const remove = async (p: Product) => {
    if (!confirm(`¿Eliminar "${p.name}"?`)) return;
    await api.del(`/client/products/${p.id}`);
    reload();
    reloadMe();
  };

  const limit = me.usage.plan.maxProducts;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Revestimientos</h1>
          <p>
            Precios y stock que ven tus clientes. {limit != null && `${me.usage.products} de ${limit} en tu plan.`}
          </p>
        </div>
        <button className="btn btn-accent" onClick={() => setEditing({})} disabled={me.usage.productsLeft === 0}>
          + Agregar revestimiento
        </button>
      </div>

      {!data ? (
        <Spinner />
      ) : data.length === 0 ? (
        <Empty>Todavía no cargaste revestimientos. Agregá el primero o importalo del catálogo RevestIA.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="sheet">
            <thead>
              <tr>
                <th>Revestimiento</th>
                <th>Categoría</th>
                <th className="num">m²/caja</th>
                <th className="num">Precio/caja</th>
                <th className="num">Stock (cajas)</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                      <span className="swatch" style={{ background: p.color }} />
                      <span>
                        <strong>{p.name}</strong>
                        <br />
                        <small className="muted">{p.sku ?? "sin SKU"} · {PATTERN_LABEL[p.pattern]}</small>
                      </span>
                    </span>
                  </td>
                  <td>{p.category}</td>
                  <td className="num">{p.m2PerBox}</td>
                  <td className="num">
                    <InlineNumber value={p.pricePerBox} format={fmtMoney} onSave={(v) => patch(p, { pricePerBox: v })} />
                  </td>
                  <td className="num">
                    <InlineNumber value={p.stockBoxes} onSave={(v) => patch(p, { stockBoxes: Math.round(v) })} warn={p.stockBoxes < 20} />
                  </td>
                  <td>
                    <button className="icon-btn" style={{ width: "auto" }} onClick={() => patch(p, { active: !p.active })} title="Activar / pausar">
                      {p.active ? <Badge tone="ok">Activo</Badge> : <Badge>Pausado</Badge>}
                    </button>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(p)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
            reloadMe();
          }}
        />
      )}
    </>
  );
}

function InlineNumber({ value, onSave, format, warn }: { value: number; onSave: (v: number) => void; format?: (n: number) => string; warn?: boolean }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(String(value));
  if (!edit)
    return (
      <button className="icon-btn" style={{ width: "auto", padding: "0 8px", color: warn ? "var(--warn)" : "inherit", fontWeight: warn ? 600 : 400 }} onClick={() => { setV(String(value)); setEdit(true); }} title="Click para editar">
        {format ? format(value) : value}
      </button>
    );
  const commit = () => {
    setEdit(false);
    const n = Number(v);
    if (!Number.isNaN(n) && n >= 0 && n !== value) onSave(n);
  };
  return (
    <input className="input" style={{ width: 110, minHeight: 34, padding: "4px 8px", textAlign: "right" }} type="number" min={0} autoFocus value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />
  );
}

function ProductForm({ initial, onClose, onSaved }: { initial: Partial<Product>; onClose: () => void; onSaved: () => void }) {
  const isNew = !initial.id;
  const [f, setF] = useState({ ...EMPTY, ...initial, sku: initial.sku ?? "" });
  const [error, setError] = useState("");
  const { data: catalog } = useLoad<Coating[]>("/client/catalog");
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v });

  const fromCatalog = (id: string) => {
    const c = catalog?.find((x) => x.id === id);
    if (c) setF({ ...f, coatingId: c.id, name: c.name, category: c.category, color: c.color, pattern: c.pattern, m2PerBox: c.m2PerBox, wastePct: c.wastePct });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const body = { coatingId: f.coatingId, name: f.name, sku: f.sku || null, category: f.category, color: f.color, pattern: f.pattern, m2PerBox: Number(f.m2PerBox), wastePct: Number(f.wastePct), pricePerBox: Number(f.pricePerBox), stockBoxes: Math.round(Number(f.stockBoxes)), active: f.active };
    try {
      if (isNew) await api.post("/client/products", body);
      else await api.patch(`/client/products/${initial.id}`, body);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar");
    }
  };

  return (
    <Modal title={isNew ? "Nuevo revestimiento" : "Editar revestimiento"} onClose={onClose} wide>
      <form className="form-grid" onSubmit={submit}>
        {isNew && (
          <div className="full">
            <Field label="Importar del catálogo RevestIA (opcional)">
              <select value={f.coatingId ?? ""} onChange={(e) => fromCatalog(e.target.value)}>
                <option value="">— Cargar a mano —</option>
                {catalog?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
                ))}
              </select>
            </Field>
          </div>
        )}
        <Field label="Nombre"><input required value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="SKU"><input value={f.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
        <Field label="Categoría">
          <select value={f.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Tipo de diseño">
          <select value={f.pattern} onChange={(e) => set("pattern", e.target.value as Product["pattern"])}>
            {PATTERNS.map((p) => <option key={p} value={p}>{PATTERN_LABEL[p]}</option>)}
          </select>
        </Field>
        <Field label="Color"><input type="color" value={f.color} onChange={(e) => set("color", e.target.value)} /></Field>
        <Field label="m² por caja"><input type="number" step="0.01" min="0.01" required value={f.m2PerBox} onChange={(e) => set("m2PerBox", Number(e.target.value))} /></Field>
        <Field label="Precio por caja ($)"><input type="number" min="0" required value={f.pricePerBox} onChange={(e) => set("pricePerBox", Number(e.target.value))} /></Field>
        <Field label="Stock (cajas)"><input type="number" min="0" required value={f.stockBoxes} onChange={(e) => set("stockBoxes", Number(e.target.value))} /></Field>
        <Field label="% desperdicio por cortes" hint="Se suma al cálculo de cajas"><input type="number" min="0" max="50" value={f.wastePct} onChange={(e) => set("wastePct", Number(e.target.value))} /></Field>
        {error && <div className="alert full">{error}</div>}
        <div className="full row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
