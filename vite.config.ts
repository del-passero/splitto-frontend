// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr"; // <-- обязательно!

export default defineConfig({
  plugins: [react(), svgr()],
});
