import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { estimateQuantity, type QuantityResult } from "@revestia/shared";
import { ApiError, Field, Logo, Spinner, createApi, fmtMoney } from "@revestia/ui";
import { BEFORE, RoomScene, type PatternKind } from "../components/RoomScene";

/**
 * Experiencia del USUARIO FINAL, embebida en la web del comercio (iframe).
 * Requiere registrarse con email antes de visualizar.
 */
interface WProduct {
  id: string;
  name: string;
  category: string;
  color: string;
  pattern: PatternKind;
  m2PerBox: number;
  wastePct: number;
  pricePerBox: number;
  stockBoxes: number;
}
interface WInfo {
  commerce: { name: string; slug: string };
  products: WProduct[];
  paymentMethods: { type: string; label: string }[];
  visualizationsLeft: number | null;
}

export function Widget() {
  const { slug = "" } = useParams();
  const wapi = useMemo(() => createApi({ tokenKey: `revestia.widget.${slug}` }), [slug]);
  const [info, setInfo] = useState<WInfo | null>(null);
  const [error, setError] = useState("");
  const [logged, setLogged] = useState(!!wapi.getToken());

  useEffect(() => {
    wapi.get<WInfo>(`/widget/${slug}`, null).then(setInfo).catch((e) => setError(e.message));
  }, [slug, wapi]);

  if (error) return <div className="widget"><div className="alert">{error}</div></div>;
  if (!info) return <Spinner />;

  return (
    <div className="widget">
      <div className="spread" style={{ marginBottom: 16 }}>
        <div>
          <span className="eyebrow">{info.commerce.name}</span>
          <h2 style={{ margin: "4px 0 0" }}>Visualizá tu ambiente</h2>
        </div>
        <span className="muted row" style={{ fontSize: 12 }}>
          con <Logo size={18} />
        </span>
      </div>
      {logged ? <Visualizer info={info} wapi={wapi} /> : <Gate slug={slug} wapi={wapi} onDone={() => setLogged(true)} />}
    </div>
  );
}

function Gate({ slug, wapi, onDone }: { slug: string; wapi: ReturnType<typeof createApi>; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const r = await wapi.post<{ token: string }>(`/widget/${slug}/register`, { email, name: name || undefined }, null);
      wapi.setToken(r.token);
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Error");
    }
  };
  return (
    <div className="widget-grid">
      <div className="widget-stage">
        <RoomScene {...BEFORE} label="Tu ambiente" />
      </div>
      <form className="card stack" onSubmit={submit}>
        <h3>Registrate para empezar</h3>
        <p className="muted" style={{ margin: 0 }}>
          Con tu email vas a poder probar revestimientos en tu ambiente y calcular cuántas cajas necesitás.
        </p>
        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Nombre (opcional)">
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
        </Field>
        {err && <div className="alert">{err}</div>}
        <button className="btn btn-accent btn-lg">Continuar</button>
      </form>
    </div>
  );
}

function Visualizer({ info, wapi }: { info: WInfo; wapi: ReturnType<typeof createApi> }) {
  const [sel, setSel] = useState<WProduct | null>(info.products[0] ?? null);
  const [surface, setSurface] = useState<"wall" | "floor">("floor");
  const [w, setW] = useState(4);
  const [l, setL] = useState(3.5);
  const [result, setResult] = useState<(QuantityResult & { inStock?: boolean; stockBoxes?: number }) | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sel) setSurface(["PISO", "EXTERIOR"].includes(sel.category) ? "floor" : "wall");
    setResult(null);
    setMsg(null);
  }, [sel]);

  if (!sel) return <div className="empty">Este comercio todavía no cargó revestimientos.</div>;

  const area = Math.max(0, w * l);
  const preview = area > 0 ? estimateQuantity({ areaM2: area, m2PerBox: sel.m2PerBox, wastePct: sel.wastePct, pricePerBox: sel.pricePerBox }) : null;
  const finish = { color: sel.color, pattern: sel.pattern };
  const scene = surface === "floor" ? { wall: BEFORE.wall, floor: finish } : { wall: finish, floor: BEFORE.floor };

  const visualize = async () => {
    setBusy(true);
    setMsg(null);
    try {
      setResult(await wapi.post(`/widget/${info.commerce.slug}/visualize`, { productId: sel.id, areaM2: area }));
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  };
  const buy = async () => {
    setBusy(true);
    try {
      await wapi.post(`/widget/${info.commerce.slug}/purchase`, { productId: sel.id, areaM2: area });
      setMsg({ ok: true, text: `¡Listo! ${info.commerce.name} recibió tu pedido y te va a contactar para coordinar el pago y la entrega.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="widget-grid">
      <div className="stack">
        <div className="widget-stage">
          <RoomScene {...(result ? scene : { wall: BEFORE.wall, floor: BEFORE.floor })} label={`Ambiente con ${sel.name}`} />
        </div>
        <div className="chips" role="listbox" aria-label="Revestimientos">
          {info.products.map((p) => (
            <button key={p.id} role="option" aria-selected={p.id === sel.id} className={`chip ${p.id === sel.id ? "on" : ""}`} onClick={() => setSel(p)}>
              <span className="swatch" style={{ background: p.color }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>
      <div className="card stack">
        <div className="spread">
          <h3 style={{ margin: 0 }}>{sel.name}</h3>
          <div className="seg" role="group" aria-label="Superficie">
            <button className={surface === "floor" ? "on" : ""} onClick={() => setSurface("floor")}>Piso</button>
            <button className={surface === "wall" ? "on" : ""} onClick={() => setSurface("wall")}>Pared</button>
          </div>
        </div>
        <span className="muted" style={{ fontSize: 13 }}>
          {fmtMoney(sel.pricePerBox)} por caja · {sel.m2PerBox} m²/caja
        </span>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Field label={surface === "floor" ? "Largo (m)" : "Ancho (m)"}>
            <input type="number" min={0} step={0.1} value={w} onChange={(e) => setW(Number(e.target.value))} />
          </Field>
          <Field label={surface === "floor" ? "Ancho (m)" : "Alto (m)"}>
            <input type="number" min={0} step={0.1} value={l} onChange={(e) => setL(Number(e.target.value))} />
          </Field>
        </div>
        {preview && (
          <div className="result">
            <div>
              <span>Superficie</span>
              <strong>{preview.areaM2} m²</strong>
            </div>
            <div>
              <span>+{preview.wastePct}% cortes</span>
              <strong>{preview.areaWithWasteM2} m²</strong>
            </div>
            <div className="big">
              <span>Necesitás</span>
              <strong>
                {preview.boxes} cajas · {fmtMoney(preview.total ?? 0)}
              </strong>
            </div>
          </div>
        )}
        {!result ? (
          <button className="btn btn-accent btn-lg" onClick={visualize} disabled={busy || !area}>
            Ver en mi ambiente
          </button>
        ) : (
          <>
            {result.inStock === false && <div className="alert">Stock disponible: {result.stockBoxes} cajas. Consultá al comercio.</div>}
            <button className="btn btn-accent btn-lg" onClick={buy} disabled={busy || result.inStock === false}>
              Comprar {preview?.boxes ?? result.boxes} cajas
            </button>
            {info.paymentMethods.length > 0 && (
              <span className="muted" style={{ fontSize: 13 }}>
                Medios de pago: {info.paymentMethods.map((p) => p.label).join(" · ")}
              </span>
            )}
          </>
        )}
        {msg && <div className={`alert ${msg.ok ? "alert-ok" : ""}`}>{msg.text}</div>}
      </div>
    </div>
  );
}
