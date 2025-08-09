import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(async () => {
  const isProd = process.env.NODE_ENV === "production";
  const isReplit = !!process.env.REPL_ID;

  const plugins = [react()];

  // Optional: Replit-only runtime error overlay (dev only)
  if (!isProd && isReplit) {
    const runtimeErrorOverlay = (await import("@replit/vite-plugin-runtime-error-modal")).default;
    plugins.push(runtimeErrorOverlay());
  }

  // Optional: Replit Cartographer (dev only)
  if (!isProd && isReplit) {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    plugins.push(cartographer());
  }

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
