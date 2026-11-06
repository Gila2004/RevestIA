/// <reference types="vite/client" />
interface ImportMetaEnv {
  /** URL pública de la API, ej: https://revestia-api.vercel.app/api (en desarrollo se usa el proxy /api) */
  readonly VITE_API_URL?: string;
}
