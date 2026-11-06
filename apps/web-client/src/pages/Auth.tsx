import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { PLANS, type PlanCode } from "@revestia/shared";
import { ApiError, Field, Logo } from "@revestia/ui";
import { api } from "../api";
import { RoomScene } from "../components/RoomScene";

function AuthShell({ children, quote }: { children: ReactNode; quote: string }) {
  return (
    <div className="auth">
      <aside className="auth-side" aria-hidden="true">
        <RoomScene wall={{ color: "#c27a52", pattern: "tile" }} floor={{ color: "#c9a77c", pattern: "plank" }} />
        <p className="auth-quote">{quote}</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="logo-link">
            <Logo />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}

export function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post<{ token: string }>("/client/auth/login", { email, password }, null);
      api.setToken(r.token);
      nav("/panel");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell quote="Tus clientes deciden más rápido cuando ven el resultado.">
      <h1>Ingresá a tu panel</h1>
      <p className="muted">Gestioná tus revestimientos, ventas y usuarios.</p>
      <form className="stack" onSubmit={submit} style={{ marginTop: 24 }}>
        <Field label="Email">
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Contraseña">
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <div className="alert">{error}</div>}
        <button className="btn btn-accent btn-lg" disabled={busy}>
          {busy ? "Ingresando…" : "Ingresar"}
        </button>
        <p className="muted">
          ¿No tenés cuenta? <Link to="/registro">Creala gratis</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function Register() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initial = (params.get("plan") as PlanCode) ?? "FREE";
  const [plan, setPlan] = useState<PlanCode>(initial in PLANS ? initial : "FREE");
  const [form, setForm] = useState({ commerceName: "", name: "", email: "", password: "", phone: "", website: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api.post<{ token: string }>(
        "/client/auth/register",
        { ...form, phone: form.phone || undefined, website: form.website || undefined },
        null,
      );
      api.setToken(r.token);
      if (plan !== "FREE") await api.post("/client/plan", { plan });
      nav("/panel");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell quote="Registrate y sumá RevestIA a tu web hoy mismo.">
      <h1>Creá tu cuenta</h1>
      <p className="muted">En un minuto tenés tu panel y el código para tu web.</p>
      <form className="form-grid" onSubmit={submit} style={{ marginTop: 24 }}>
        <Field label="Nombre del comercio">
          <input required value={form.commerceName} onChange={set("commerceName")} />
        </Field>
        <Field label="Tu nombre">
          <input required value={form.name} onChange={set("name")} autoComplete="name" />
        </Field>
        <div className="full">
          <Field label="Email">
            <input type="email" required value={form.email} onChange={set("email")} autoComplete="email" />
          </Field>
        </div>
        <div className="full">
          <Field label="Contraseña" hint="Mínimo 8 caracteres">
            <input type="password" required minLength={8} value={form.password} onChange={set("password")} autoComplete="new-password" />
          </Field>
        </div>
        <Field label="Teléfono (opcional)">
          <input value={form.phone} onChange={set("phone")} autoComplete="tel" />
        </Field>
        <Field label="Web (opcional)">
          <input value={form.website} onChange={set("website")} placeholder="tucomercio.com" />
        </Field>
        <div className="full">
          <Field label="Plan">
            <select value={plan} onChange={(e) => setPlan(e.target.value as PlanCode)}>
              {Object.values(PLANS).map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} — {p.priceMonthlyUsd ? `USD ${p.priceMonthlyUsd}/mes` : "Gratis"}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {error && <div className="alert full">{error}</div>}
        <button className="btn btn-accent btn-lg full" disabled={busy}>
          {busy ? "Creando cuenta…" : "Crear cuenta"}
        </button>
        <p className="muted full">
          ¿Ya tenés cuenta? <Link to="/ingresar">Ingresá</Link>
        </p>
      </form>
    </AuthShell>
  );
}
