/**
 * Cliente HTTP mínimo. Cada app crea el suyo con su propia clave de sesión,
 * así una sesión de cliente nunca se mezcla con la del superadmin.
 */
export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function createApi(opts: { baseUrl?: string; tokenKey: string; onUnauthorized?: () => void }) {
  const base = opts.baseUrl ?? "/api";

  const getToken = () => {
    try {
      return localStorage.getItem(opts.tokenKey);
    } catch {
      return null;
    }
  };
  const setToken = (t: string | null) => {
    try {
      if (t) localStorage.setItem(opts.tokenKey, t);
      else localStorage.removeItem(opts.tokenKey);
    } catch {
      /* almacenamiento bloqueado */
    }
  };

  async function request<T>(method: string, path: string, body?: unknown, token?: string | null): Promise<T> {
    const t = token === undefined ? getToken() : token;
    const r = await fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = r.status === 204 ? null : await r.json().catch(() => null);
    if (!r.ok) {
      if (r.status === 401 && t) opts.onUnauthorized?.();
      throw new ApiError(r.status, (data as { error?: string })?.error ?? "Error de conexión", (data as { details?: unknown })?.details);
    }
    return data as T;
  }

  return {
    getToken,
    setToken,
    get: <T,>(p: string, token?: string | null) => request<T>("GET", p, undefined, token),
    post: <T,>(p: string, b?: unknown, token?: string | null) => request<T>("POST", p, b ?? {}, token),
    patch: <T,>(p: string, b: unknown) => request<T>("PATCH", p, b),
    del: <T,>(p: string) => request<T>("DELETE", p),
  };
}
