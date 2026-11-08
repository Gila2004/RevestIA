import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@revestia/ui";
import { BeforeAfter } from "../components/BeforeAfter";
import { api, visitorId } from "../api";
import { LeadForm } from "./Landing";

/** URL de la web Superadmin (app separada). Se configura con VITE_ADMIN_URL en cada deploy. */
const ADMIN_URL = (import.meta.env.VITE_ADMIN_URL ?? "http://localhost:5174").replace(/\/$/, "");

const B2B = [
  {
    t: "Fricción cero en cotización",
    d: "Automatizá el cálculo de m², cajas requeridas y margen de desperdicio recomendado, eliminando errores de cálculo en obra.",
  },
  {
    t: "Personalización White-Label",
    d: "La plataforma adopta tu identidad corporativa, tus logotipos, catálogo de productos y precios sincronizados en tiempo real.",
  },
  {
    t: "Optimización comercial",
    d: "Reducí hasta un 80% las consultas repetitivas de los vendedores y multiplicá la conversión de visitantes digitales en ventas cerradas.",
  },
  {
    t: "Analítica y datos del consumidor",
    d: "Métricas en tiempo real sobre qué cerámicos, maderas o mármoles generan mayor interés y cotizaciones.",
  },
];

const B2C = [
  {
    t: "Visualización en Realidad Aumentada",
    d: "Prueban distintas alternativas directamente sobre fotos de sus propios ambientes.",
  },
  {
    t: "Asesor virtual inteligente",
    d: "IA orientada a recomendar opciones según espacio, estilo y presupuesto.",
  },
  {
    t: "Uso 100% gratuito",
    d: "Sin fricciones para la toma de decisiones rápidas.",
  },
];

const PLAN_COLS = [
  { name: "Free / Pilot Trial", hl: false },
  { name: "Freemium (Standard SaaS)", hl: true },
  { name: "Premium (Enterprise / Custom)", hl: false },
];

const PLAN_ROWS: { label: string; values: [string, string, string]; strong?: boolean }[] = [
  { label: "Precio licencia mensual", values: ["USD 0 / mes (durante 14 días)", "USD 20 / mes", "USD 35 / mes (o a medida)"], strong: true },
  { label: "Fee de implementación", values: ["Sin costo de setup", "USD 2.000 (pago único)", "USD 50 (setup avanzado + migración)"] },
  {
    label: "Perfil de cliente",
    values: [
      "Locales o corralones en fase de prueba/validación.",
      "Comercios y distribuidores de gama media/alta con presencia digital.",
      "Cadenas nacionales o distribuidores mayoristas multibrand.",
    ],
  },
  { label: "Personalización White-Label", values: ["Genérica / Logo REVEST.IA", "Logo y colores de tu marca", "Customización White-Label total (dominio propio)"] },
  { label: "Límite de catálogo", values: ["Hasta 20 SKUs de productos", "Hasta 500 SKUs sincronizados", "Catálogo ilimitado de productos"] },
  { label: "Visualizador AR + IA", values: ["Incluido (básico)", "Incluido (IA de recomendación avanzada)", "Incluido (rendimiento ultra HD + IA predictiva)"] },
  {
    label: "Cálculo automático de metraje",
    values: ["Calculadora estándar (m²)", "Calculadora + desperdicio + conversión a cajas", "Integración directa con pasarela de pago/ERP"],
  },
  {
    label: "Módulos de analítica",
    values: ["Métricas básicas de uso", "Tablero de analítica de ventas e interés de clientes", "Dashboard BI avanzado + CRM de prospectos integrado"],
  },
  { label: "Control de stock", values: ["No disponible", "Sincronización diaria", "Stock e inventario en tiempo real"] },
  {
    label: "Soporte técnico",
    values: ["Vía correo electrónico", "Soporte prioritario y capacitación comercial", "Account Manager dedicado 24/7 y SLA garantizado"],
  },
];

const FAQ = [
  {
    q: "¿Cómo se integra REVEST.IA a mi sitio web o e-commerce?",
    a: "REVEST.IA opera mediante módulos flexibles. Podemos integrarlo fácilmente a tu e-commerce actual vía API o enlace personalizado en tu sitio web. En el plan Premium realizamos integraciones directas a tu ERP para mantener stock y precios sincronizados automáticamente.",
  },
  {
    q: "¿Qué costo tiene para mis clientes utilizar la herramienta?",
    a: "Para el cliente final o usuario que está remodelando o construyendo, la herramienta es 100% gratuita. Tu empresa absorbe el servicio como una herramienta de fidelización y aceleración de ventas.",
  },
  {
    q: "¿Qué incluye el Fee de Implementación inicial?",
    a: "El fee único inicial cubre la carga y curación de tu catálogo de cerámicos/porcelanatos, la digitalización de texturas para la IA, la configuración visual con la identidad de tu marca y la capacitación de tu equipo comercial.",
  },
  {
    q: "¿Mis clientes necesitan descargar una App para usar la Realidad Aumentada?",
    a: "No. REVEST.IA es una plataforma web totalmente autogestionable e intuitiva. El usuario simplemente sube una foto desde el navegador de su teléfono móvil o computadora y visualiza el revestimiento al instante.",
  },
  {
    q: "¿Es posible solicitar una prueba piloto para nuestra sucursal?",
    a: "Sí, contamos con un plan de prueba de 14 días diseñado para validar métricas de conversión y medir la reducción de tiempo de asesoramiento de tu equipo en sucursales físicas o digitales.",
  },
];

/** Página de bienvenida institucional de REVEST.IA (ruta "/"). */
export function Welcome() {
  useEffect(() => {
    api.post("/public/pageview", { visitorId: visitorId(), path: location.pathname + location.hash }, null).catch(() => {});
  }, []);

  return (
    <div className="welcome">
      <header className="nav">
        <div className="container nav-inner">
          <Link to="/" className="logo-link" aria-label="REVEST.IA inicio">
            <Logo />
          </Link>
          <div className="welcome-nav">
            <a href="#beneficios">Beneficios</a>
            <a href="#planes">Planes</a>
            <a href="#faq">Preguntas frecuentes</a>
            <Link to="/ingresar" className="btn btn-accent btn-sm">
              LOGIN
            </Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">B2B SaaS White-Label para revestimientos</span>
            <h1>
              Transformá tu catálogo pasivo en una experiencia de compra interactiva con <em>IA y Realidad Aumentada.</em>
            </h1>
            <p className="lead">
              Menos consultas repetitivas, más ventas cerradas. REVEST.IA permite a tus clientes visualizar revestimientos en su espacio real,
              recibir recomendaciones inteligentes de IA y calcular insumos exactos con tu stock sincronizado en tiempo real.
            </p>
            <div className="row">
              <Link to="/comercios" className="btn btn-accent btn-lg">
                Probar Demo Interactiva
              </Link>
              <a href="#agendar" className="btn btn-ghost btn-lg">
                Agendar Demostración B2B
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <BeforeAfter after={{ wall: { color: "#ece6dc", pattern: "stone" }, floor: { color: "#7a5236", pattern: "plank" } }} />
            <p className="hero-caption">Arrastrá para comparar el antes y el después.</p>
          </div>
        </div>
      </section>

      <section id="beneficios" className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Propuesta de valor</span>
            <h2>Beneficios para tu empresa y para tus clientes</h2>
          </div>

          <h3 className="benefit-group">Para empresas de revestimientos y construcción (B2B)</h3>
          <div className="benefits benefits-4">
            {B2B.map((b, i) => (
              <article key={b.t} className="step">
                <span className="step-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{b.t}</h3>
                <p>{b.d}</p>
              </article>
            ))}
          </div>

          <h3 className="benefit-group">Para tus clientes finales (B2C)</h3>
          <div className="benefits benefits-3">
            {B2C.map((b) => (
              <article key={b.t} className="step step-sage">
                <h3>{b.t}</h3>
                <p>{b.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planes" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Planes y precios</span>
            <h2>Matriz de planes</h2>
            <p className="muted">Licencia SaaS mensual + fee de implementación inicial, en USD.</p>
          </div>
          <div className="pricing-wrap">
            <table className="pricing">
              <thead>
                <tr>
                  <th scope="col">Característica / Plan</th>
                  {PLAN_COLS.map((c) => (
                    <th key={c.name} scope="col" className={c.hl ? "hl" : ""}>
                      {c.hl && <span className="pricing-badge">Recomendado</span>}
                      Plan {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_ROWS.map((r) => (
                  <tr key={r.label} className={r.strong ? "strong" : ""}>
                    <th scope="row">{r.label}</th>
                    {r.values.map((v, i) => (
                      <td key={i} className={PLAN_COLS[i].hl ? "hl" : ""}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="faq" className="section">
        <div className="container faq-container">
          <div className="section-head">
            <span className="eyebrow">Preguntas frecuentes</span>
            <h2>Todo lo que necesitás saber</h2>
          </div>
          <div className="faq">
            {FAQ.map((f) => (
              <details key={f.q} open>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="agendar" className="section">
        <div className="container">
          <div className="cta-band">
            <div>
              <h2>Agendá una demostración B2B</h2>
              <p>Dejanos tu email y te mostramos REVEST.IA funcionando con el catálogo de tu comercio o corralón.</p>
              <Link to="/comercios" className="btn btn-light btn-lg">
                Probar Demo Interactiva
              </Link>
            </div>
            <LeadForm />
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container spread">
          <Logo size={22} />
          <span className="muted footer-right">
            © {new Date().getFullYear()} REVEST.IA. Hecho para comercios de revestimientos.
            {/* Acceso discreto al Superadmin (web separada, pide sus propias credenciales) */}
            <a href={ADMIN_URL} className="admin-link">
              SUPER ADMIN
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
