import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Backend runs on :8080 with no /api CORS in dev, so we proxy REST + STOMP
// through Vite. In prod, point VITE_API_BASE at the backend (and enable CORS there).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/ws": { target: "http://localhost:8080", ws: true, changeOrigin: true },
    },
  },
});
