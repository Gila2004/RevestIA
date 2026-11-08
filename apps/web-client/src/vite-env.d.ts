/// <reference types="vite/client" />
interface ImportMetaEnv {
  /** URL pública de la API, ej: https://revestia-api.vercel.app/api (en desarrollo se usa el proxy /api) */
  readonly VITE_API_URL?: string;
  /** URL de la web Superadmin, para el enlace oculto del pie de la bienvenida (en desarrollo: http://localhost:5174) */
  readonly VITE_ADMIN_URL?: string;
}
