// server/index.ts
// Load .env early in development only (no top-level await)
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env" });
}

import express, { type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-database";

// Process-level guards
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  if (process.env.NODE_ENV === "production") process.exit(1);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  if (process.env.NODE_ENV === "production") process.exit(1);
});

const app = express();

// Trust proxy (Render/NGINX/etc.)
app.set("trust proxy", 1);

// Security middleware (CSP relaxed in dev, enabled in prod)
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production",
    crossOriginEmbedderPolicy: false,
  })
);

// Compression
app.use(compression());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);
app.use("/api/auth/", authLimiter);
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);

// Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Health check (for Render)
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// Simple API request logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: unknown, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson as any, ...args);
  };

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;
    const duration = Date.now() - start;
    let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse) {
      try {
        const payload = JSON.stringify(capturedJsonResponse);
        if (payload && payload !== "{}") line += ` :: ${payload}`;
      } catch {}
    }
    if (line.length > 120) line = line.slice(0, 119) + "…";
    log(line);
  });

  next();
});

(async () => {
  try {
    // Initialize database
    console.log("Starting database initialization...");
    const dbInitialized = await initializeDatabase();
    console.log(
      dbInitialized
        ? "Database initialization successful - full functionality available"
        : "Database initialization failed - retrying during runtime operations"
    );

    // Register routes (returns underlying http.Server)
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Request error:", err);
      if (!res.headersSent) res.status(status).json({ message });
      // Do NOT throw here; let the server continue running.
    });

    // Dev vs Prod serving
    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server); // DEV
    } else {
      serveStatic(app); // PROD
    }

    // Bind to injected port or default 5000
    const port = Number(process.env.PORT || 5000);
    const listenOpts: any = { port, host: "0.0.0.0" };
    if (process.platform !== "win32") listenOpts.reusePort = true;

    // Graceful shutdown
    const shutdown = (sig: string) => {
      console.log(`Received ${sig}, shutting down gracefully…`);
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    server.listen(listenOpts, () => {
      log(`Serving on port ${port}`);
    });
  } catch (e) {
    console.error("Fatal boot error:", e);
    process.exit(1);
  }
})();
