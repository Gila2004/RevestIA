import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, Field, Logo } from "@revestia/ui";
import { api } from "../api";

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
      const r = await api.post<{ token: string }>("/admin/auth/login", { email, password }, null);
      api.setToken(r.token);
      nav("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="card stack" onSubmit={submit}>
        <Logo />
        <div>
          <h1>Acceso superadmin</h1>
          <p className="muted" style={{ margin: 0 }}>Solo para el equipo de RevestIA.</p>
        </div>
        <Field label="Email">
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Contraseña">
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <div className="alert">{error}</div>}
        <button className="btn btn-lg" disabled={busy}>{busy ? "Ingresando…" : "Ingresar"}</button>
      </form>
    </div>
  );
}
