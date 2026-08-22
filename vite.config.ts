import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  base: loadEnv(mode, ".", "").VITE_BASE_PATH || "/family-finance-planner/",
  plugins: [react()],
}));
