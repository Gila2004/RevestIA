import { useState, type FormEvent } from "react";
import { CATEGORIES, PATTERNS } from "@revestia/shared";
import { ApiError, Empty, Field, Modal, Spinner } from "@revestia/ui";
import { api } from "../api";
import { useLoad } from "../Layout";

interface Coating {
  id: string;
  name: string;
  category: string;
  material: string;
  finish: string;
  color: string;
  pattern: string;
  m2PerBox: number;
  wastePct: number;
  description: string | null;
  usedBy: number;
}
const EMPTY = { name: "", category: "PISO", material: "", finish: "", color: "#c8b8a6", pattern: "tile", m2PerBox: 1.44, wastePct: 10, description: "" };
const PATTERN_LABEL: Record<string, string> = { tile: "Cerámico", plank: "Tablas", stone: "Piedra", mosaic: "Venecita" };

/** Catálogo maestro: el superadmin integra todos los revestimientos que los comercios pueden importar. */
export function Catalog() {
  const { data, reload } = useLoad<Coating[]>("/admin/coatings");
  const [editing, setEditing] = useState<Partial<Coating> | null>(null);

  const remove = async (c: Coating) => {
    if (!confirm(`¿Eliminar "${c.name}" del catálogo? Los comercios que lo usan conservan su copia.`)) return;
    await api.del(`/admin/coatings/${c.id}`);
    reload();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Catálogo maestro</h1>
          <p>Revestimientos que los comercios pueden importar a su tienda con un click.</p>
        </div>
        <button className="btn btn-accent" onClick={() => setEditing({})}>+ Nuevo revestimiento</button>
      </div>
      {!data ? (
        <Spinner />
      ) : !data.length ? (
        <Empty>El catálogo está vacío.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="sheet">
            <thead>
              <tr>
                <th>Revestimiento</th>
                <th>Categoría</th>
                <th>Material / terminación</th>
                <th className="num">m²/caja</th>
                <th className="num">Desperdicio</th>
                <th className="num">Usado por</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                      <span className="swatch" style={{ background: c.color }} />
                      <span><strong>{c.name}</strong><br /><small className="muted">{PATTERN_LABEL[c.pattern]}</small></span>
                    </span>
                  </td>
                  <td>{c.category}</td>
                  <td>{c.material} · {c.finish}</td>
                  <td className="num">{c.m2PerBox}</td>
                  <td className="num">{c.wastePct}%</td>
                  <td className="num">{c.usedBy} comercios</td>
                  <td>
                    <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <CoatingForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

function CoatingForm({ initial, onClose, onSaved }: { initial: Partial<Coating>; onClose: () => void; onSaved: () => void }) {
  const isNew = !initial.id;
  const [f, setF] = useState({ ...EMPTY, ...initial, description: initial.description ?? "" });
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const body = { name: f.name, category: f.category, material: f.material, finish: f.finish, color: f.color, pattern: f.pattern, m2PerBox: Number(f.m2PerBox), wastePct: Number(f.wastePct), description: f.description || null };
    try {
      if (isNew) await api.post("/admin/coatings", body);
      else await api.patch(`/admin/coatings/${initial.id}`, body);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al guardar");
    }
  };

  return (
    <Modal title={isNew ? "Nuevo revestimiento" : "Editar revestimiento"} onClose={onClose} wide>
      <form className="form-grid" onSubmit={submit}>
        <div className="full"><Field label="Nombre"><input required value={f.name} onChange={set("name")} /></Field></div>
        <Field label="Categoría">
          <select value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Diseño">
          <select value={f.pattern} onChange={set("pattern")}>{PATTERNS.map((p) => <option key={p} value={p}>{PATTERN_LABEL[p]}</option>)}</select>
        </Field>
        <Field label="Material"><input required value={f.material} onChange={set("material")} placeholder="Porcelanato" /></Field>
        <Field label="Terminación"><input required value={f.finish} onChange={set("finish")} placeholder="Mate" /></Field>
        <Field label="Color"><input type="color" value={f.color} onChange={set("color")} /></Field>
        <Field label="m² por caja"><input type="number" step="0.01" min="0.01" required value={f.m2PerBox} onChange={set("m2PerBox")} /></Field>
        <Field label="% desperdicio"><input type="number" min="0" max="50" value={f.wastePct} onChange={set("wastePct")} /></Field>
        <div className="full"><Field label="Descripción"><input value={f.description} onChange={set("description")} /></Field></div>
        {error && <div className="alert full">{error}</div>}
        <div className="full row" style={{ justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
