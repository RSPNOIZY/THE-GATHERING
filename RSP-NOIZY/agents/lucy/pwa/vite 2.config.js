import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config for the Lucy PWA. Tailwind via postcss.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});
