import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(() => {
  // Use only the standard React plugin.  Replit-specific plugins are removed
  // because they are only relevant when running within the Replit environment.
  const plugins = [react()];

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    base: "/", // ensure correct asset paths in prod
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
