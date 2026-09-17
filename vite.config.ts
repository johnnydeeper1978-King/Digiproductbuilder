import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Only VITE_-prefixed env vars are exposed to the client bundle.
// Server-only secrets (service-role key, AI provider keys, Stripe secret)
// must never be VITE_-prefixed and are never read here.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { port: 5173 },
});
