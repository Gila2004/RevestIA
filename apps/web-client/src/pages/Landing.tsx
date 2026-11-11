import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { PLANS, formatSetupFee, type PlanDefinition } from "@revestia/shared";
import { Logo } from "@revestia/ui";
import { BeforeAfter } from "../components/BeforeAfter";
import { api, visitorId } from "../api";
import type { Finish } from "../components/RoomScene";

const LOOKS: { name: string; wall: Finish; floor: Finish }[] = [
  { name: "Terracota + roble", wall: { color: "#c27a52", pattern: "tile" }, floor: { color: "#c9a77c", pattern: "plank" } },
  { name: "Mármol + nogal", wall: { color: "#ece6dc", pattern: "stone" }, floor: { color: "#7a5236", pattern: "plank" } },
  { name: "Venecita salvia + piedra", wall: { color: "#8a9a7b", pattern: "mosaic" }, floor: { color: "#9b9a96", pattern: "stone" } },
];

const STEPS = [
  { n: "01", t: "Cargá tu catálogo", d: "Subí tus revestimientos con precio, stock y m² por caja. O importalos del catálogo de RevestIA." },
  { n: "02", t: "Sumá RevestIA a tu web", d: "Copiás un código y listo: tu web tiene visualizador y calculadora en minutos." },
  { n: "03", t: "Tu cliente decide y compra", d: "Ve su ambiente terminado, sabe cuántas cajas lleva y cuánto gasta. Vos sumás su email." },
];

export function Landing() {
  const [look, setLook] = useState(0);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    api.post("/public/pageview", { visitorId: visitorId(), path: location.pathname + location.hash }, null).catch(() => {});
  }, []);

  return (
    <div className="landing">
      <header className="nav">
        <div className="container nav-inner">
          <Link to="/" className="logo-link" aria-label="RevestIA inicio">
            <Logo />
          </Link>
          <nav className={`nav-links ${menu ? "open" : ""}`} onClick={() => setMenu(false)}>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#planes">Planes</a>
            <a href="#contacto">Contacto</a>
            <Link to="/ingresar" className="btn btn-ghost btn-sm">
              Ingresar
            </Link>
            <Link to="/registro" className="btn btn-accent btn-sm">
              Crear cuenta
            </Link>
          </nav>
          <button className="icon-btn nav-toggle" onClick={() => setMenu(!menu)} aria-label="Menú" aria-expanded={menu}>
            ☰
          </button>
        </div>
      </header>

      {/* HERO: call to action + antes/después + propuesta de valor */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Visualizador y calculadora para comercios de revestimientos</span>
            <h1>
              Que tu cliente <em>vea</em> su ambiente terminado antes de comprar.
            </h1>
            <p className="lead">
              RevestIA muestra cómo queda cada revestimiento y calcula las cajas exactas. Menos dudas, decisiones en minutos y más ventas para tu
              comercio.
            </p>
            <div className="row">
              <Link to="/registro" className="btn btn-accent btn-lg">
                Empezar gratis
              </Link>
              <a href="#planes" className="btn btn-ghost btn-lg">
                Ver planes
              </a>
            </div>
            <ul className="hero-points">
              <li>Decisión en minutos</li>
              <li>Cajas exactas, sin sobrantes</li>
              <li>Cada visita, un contacto</li>
            </ul>
          </div>
          <div className="hero-visual">
            <BeforeAfter after={LOOKS[look]} />
            <div className="looks" role="tablist" aria-label="Probar otras terminaciones">
              {LOOKS.map((l, i) => (
                <button key={l.name} role="tab" aria-selected={i === look} className={`look ${i === look ? "on" : ""}`} onClick={() => setLook(i)}>
                  <span className="swatch" style={{ background: l.wall.color }} />
                  <span className="swatch" style={{ background: l.floor.color }} />
                  {l.name}
                </button>
              ))}
            </div>
            <p className="hero-caption">Arrastrá para comparar. Así lo ven tus clientes en tu web.</p>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Cómo funciona</span>
            <h2>De la duda a la compra, en tres pasos</h2>
          </div>
          <div className="steps">
            {STEPS.map((s) => (
              <article key={s.n} className="step">
                <span className="step-n">{s.n}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </article>
            ))}
          </div>
          <div className="calc-demo card">
            <CalcDemo />
          </div>
        </div>
      </section>

      <section id="planes" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Planes</span>
            <h2>Elegí cómo querés crecer</h2>
            <p className="muted">Empezás gratis y cambiás de plan cuando quieras.</p>
          </div>
          <div className="plans">
            {Object.values(PLANS).map((p) => (
              <PlanCard key={p.code} plan={p} />
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Sumá RevestIA a tu web hoy</h2>
              <p>Creá tu cuenta en un minuto. O dejanos tu email y te mostramos una demo con tu catálogo.</p>
              <Link to="/registro" className="btn btn-light btn-lg">
                Crear cuenta gratis
              </Link>
            </div>
            <LeadForm />
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container spread">
          <Logo size={22} />
          <span className="muted">© {new Date().getFullYear()} RevestIA. Hecho para comercios de revestimientos.</span>
        </div>
      </footer>
    </div>
  );
}

function PlanCard({ plan }: { plan: PlanDefinition }) {
  return (
    <article className={`plan ${plan.highlighted ? "plan-hl" : ""}`}>
      {plan.highlighted && <span className="plan-ribbon">Más elegido</span>}
      <h3>{plan.name}</h3>
      <p className="plan-sub">{plan.subtitle}</p>
      <p className="plan-tag">{plan.tagline}</p>
      <div className="plan-price">
        {plan.priceMonthlyUsd === 0 ? (
          <strong>Gratis</strong>
        ) : (
          <>
            <strong>USD {plan.priceMonthlyUsd}</strong>
            <span>/mes</span>
          </>
        )}
        {plan.priceNote && <span>({plan.priceNote})</span>}
      </div>
      <p className="plan-fee">Implementación: {formatSetupFee(plan)}</p>
      <ul>
        {plan.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <Link to={`/registro?plan=${plan.code}`} className={`btn ${plan.highlighted ? "btn-accent" : "btn-ghost"}`}>
        {plan.priceMonthlyUsd === 0 ? "Probar gratis" : `Elegir ${plan.name}`}
      </Link>
    </article>
  );
}

/** Mini calculadora para demostrar la propuesta de valor sin registrarse. */
function CalcDemo() {
  const [w, setW] = useState(4);
  const [h, setH] = useState(2.6);
  const [box, setBox] = useState(1.44);
  const area = Math.max(0, w * h);
  const withWaste = area * 1.1;
  const boxes = box > 0 ? Math.ceil(withWaste / box) : 0;
  return (
    <div className="calc">
      <div>
        <span className="eyebrow">Probalo</span>
        <h3>¿Cuántas cajas lleva una pared?</h3>
        <p className="muted">RevestIA suma 10% de desperdicio por cortes y redondea a cajas enteras.</p>
      </div>
      <div className="calc-inputs">
        <label className="field">
          <span>Ancho (m)</span>
          <input type="number" min={0} step={0.1} value={w} onChange={(e) => setW(Number(e.target.value))} />
        </label>
        <label className="field">
          <span>Alto (m)</span>
          <input type="number" min={0} step={0.1} value={h} onChange={(e) => setH(Number(e.target.value))} />
        </label>
        <label className="field">
          <span>m² por caja</span>
          <input type="number" min={0.1} step={0.01} value={box} onChange={(e) => setBox(Number(e.target.value))} />
        </label>
      </div>
      <div className="calc-result">
        <span>{area.toFixed(2)} m² + 10%</span>
        <strong>{boxes} cajas</strong>
      </div>
    </div>
  );
}

export function LeadForm() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      await api.post("/public/leads", { email, company: company || undefined }, null);
      setState("ok");
    } catch {
      setState("error");
    }
  };
  if (state === "ok") return <div className="lead-form lead-ok">¡Gracias! Te escribimos en menos de 24 h.</div>;
  return (
    <form className="lead-form" onSubmit={submit}>
      <label className="field">
        <span>Email</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@tucomercio.com" />
      </label>
      <label className="field">
        <span>Comercio (opcional)</span>
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nombre de tu comercio" />
      </label>
      {state === "error" && <div className="alert">No pudimos enviarlo. Probá de nuevo.</div>}
      <button className="btn btn-accent" disabled={state === "sending"}>
        {state === "sending" ? "Enviando…" : "Quiero una demo"}
      </button>
    </form>
  );
}
