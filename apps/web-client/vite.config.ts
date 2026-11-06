import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// App independiente (Cliente): su propio puerto/origen y su propio deploy.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": "http://localhost:4000" },
  },
});
