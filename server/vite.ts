
// server/vite.ts
import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { type Server } from "node:http";

export function log(message: string, source = "server") {
  const formattedTime = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // DEV-ONLY: import vite here so production never needs the package
  const { createServer, createLogger } = await import("vite");
  const viteLogger = createLogger();

  const vite = await createServer({
    appType: "custom",
    configFile: true, // auto-load ./vite.config.ts
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    },
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
  });

  app.use(vite.middlewares);

  // DEV: serve client/index.html through Vite
  const clientIndexPath = path.resolve(process.cwd(), "client", "index.html");

  app.use("*", async (req, res, next) => {
    try {
      let template = await fs.promises.readFile(clientIndexPath, "utf-8");
      // Simple cache-bust on the dev entry
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${Date.now().toString(36)}"`
      );
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).setHeader("Content-Type", "text/html");
      res.end(html);
    } catch (e: any) {
      // keep nice stack traces in dev if available
      // @ts-expect-error - vite type
      if (vite.ssrFixStacktrace) vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // PROD: serve the Vite build output
  const distPath = path.resolve(process.cwd(), "dist", "public");
  log(`serving static from: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Run "npm run build" first.`
    );
  }

  app.use(express.static(distPath, { index: false, immutable: true, maxAge: "1y" }));

  // SPA fallback
  app.use("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
