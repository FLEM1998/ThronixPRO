// server/index.ts

import express, { type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-database";

/* -------------------- Load .env in development (safe for prod) -------------------- */
// Use a dynamic import so production does not require the package.
if (process.env.NODE_ENV !== "production") {
  try {
    await import("dotenv/config"); // Top-level await is supported in Node 20 ESM
  } catch {
    console.warn("dotenv not installed; skipping .env load");
  }
}

/* ----------------------------- Process guards ----------------------------- */

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  if (process.env.NODE_ENV === "production") process.exit(1);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  if (process.env.NODE_ENV === "production") process.exit(1);
});

/* --------------------------------- App ----------------------------------- */

const app = express();
app.disable("x-powered-by");

// Trust proxy (Render/NGINX/etc.)
app.set("trust proxy", 1);

/* ------------------------------ Security headers -------------------------- */

const isProd = process.env.NODE_ENV === "production";

app.use(
  helmet({
    contentSecurityPolicy: isProd
      ? {
          useDefaults: true,
          directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'"], // tighten if you can remove inline
            "style-src": ["'self'", "'unsafe-inline'"],
            "img-src": ["'self'", "data:", "https:"],
            "connect-src": [
              "'self'",
              ...(process.env.ALLOW_CONNECT_SRC?.split(",").map((s) => s.trim()).filter(Boolean) ||
                []),
            ],
            "frame-ancestors": ["'self'"],
            "object-src": ["'none'"],
            "base-uri": ["'self'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "no-referrer" },
    hidePoweredBy: true,
    hsts: isProd ? { maxAge: 15552000 } : undefined, // ~180 days
  })
);

/* --------------------------------- CORS ----------------------------------- */
/** Strict allow-list if CORS_ORIGIN is set (comma-separated). If FE/BE same origin, omit CORS_ORIGIN. */
if (process.env.CORS_ORIGIN) {
  const allow = process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true); // same-origin / curl
        if (allow.includes(origin)) return callback(null, true);
        return callback(new Error("CORS: Origin not allowed"));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
      credentials: false,
      maxAge: 86400,
    })
  );
}

/* ------------------------------- Compression ------------------------------ */

app.use(compression());

/* --------------------------------- Limits --------------------------------- */

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  skip: (req: Request) => req.path === "/healthz",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later" },
});

app.use("/api/", apiLimiter);
app.use("/api/auth/", authLimiter);
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);

/* -------------------------------- Parsers --------------------------------- */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

/* ------------------------------ Health checks ------------------------------ */

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

/* ----------------------------- Request logging ---------------------------- */
/** Minimal API logger with secret redaction. Avoids logging bodies for non-/api paths. */

function redactSecrets(input: string): string {
  const patterns = [
    /("(?:api_?key|access_?key|secret|password|passphrase|token|authorization)"\s*:\s*)"(.*?)"/gi,
    /(authorization"\s*:\s*")Bearer [^"]+"/gi,
  ];
  let out = input;
  for (const re of patterns) out = out.replace(re, (_m, p1) => `${p1}"[REDACTED]"`);
  out = out.replace(/\beyJ[A-Za-z0-9_\-]+?\.[A-Za-z0-9_\-]+?\.[A-Za-z0-9_\-]+/g, "[REDACTED_JWT]");
  return out;
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const reqId = randomUUID();
  res.setHeader("X-Request-ID", reqId);

  let capturedJsonResponse: unknown;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson: unknown, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson as any, ...args);
  };

  res.on("finish", () => {
    if (!path.startsWith("/api")) return;
    const duration = Date.now() - start;
    let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms (id:${reqId})`;

    if (capturedJsonResponse) {
      try {
        const payload = JSON.stringify(capturedJsonResponse);
        if (payload && payload !== "{}") {
          const safe = redactSecrets(payload);
          line += ` :: ${safe}`;
        }
      } catch {
        /* ignore */
      }
    }
    if (line.length > 300) line = line.slice(0, 299) + "…";
    log(line);
  });

  next();
});

/* ------------------------------- Bootstrap -------------------------------- */

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

    // Global error handler (keep messages generic in prod)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message =
        isProd && status === 500 ? "Internal Server Error" : err.message || "Internal Server Error";
      if (err && err.stack) console.error("Request error:", err.stack);
      else console.error("Request error:", err);
      if (!res.headersSent) res.status(status).json({ message });
    });

    // Dev vs Prod serving
    if (!isProd) {
      await setupVite(app, server); // DEV: Vite middleware & HMR
    } else {
      serveStatic(app); // PROD: serve built assets
    }

    /* --------------------------- Bind & listen --------------------------- */
    // Respect Render's injected PORT when present; default to 10000 locally
    const raw = process.env.PORT ?? process.env.SERVER_PORT ?? "10000";
    const port = Number.isFinite(Number(raw)) ? Number(raw) : 10000;

    // Host: Render => 0.0.0.0, Local Windows => 127.0.0.1 (avoids ENOTSUP on some setups)
    const host = process.env.HOST ?? (process.env.PORT ? "0.0.0.0" : "127.0.0.1");

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

    server.listen(port, host, () => {
      log(
        `HTTP server listening on ${host}:${port} (env PORT=${process.env.PORT ?? "unset"}, NODE_ENV=${
          process.env.NODE_ENV ?? "unset"
        })`
      );
    });
  } catch (e) {
    console.error("Fatal boot error:", e);
    process.exit(1);
  }
})();

