import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const legacyRoot = path.resolve(__dirname, "..");

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://something-floral-ph.test",
    },
    fs: { allow: [legacyRoot] },
  },
  build: {
    outDir: "../",
    emptyOutDir: false,
  },
  publicDir: path.join(legacyRoot, "images"),
});
