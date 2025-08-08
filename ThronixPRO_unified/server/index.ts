import express, { type Request, Response, NextFunction } from "express";
import * as Sentry from '@sentry/node';
import { secretManager } from './secret-manager';
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-database";
// import { logger } from "./logger"; // Will be available after restart

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log the error but don't exit the process in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

const app = express();

// Trust proxy for proper client IP detection
app.set('trust proxy', 1);

// Security middleware - Always enabled for production-ready security
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for React dev
  crossOriginEmbedderPolicy: false
}));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit auth attempts
  message: { error: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

// Enhanced security headers for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // -----------------------------------------------------------------------
  // Initialize Sentry for error monitoring.  Load the DSN via the secret
  // manager if available; fall back to the SENTRY_DSN environment variable.
  try {
    const secretDsn = await secretManager.getSecret('SENTRY_DSN');
    const sentryDsn = secretDsn || process.env.SENTRY_DSN;
    if (sentryDsn) {
      Sentry.init({
        dsn: sentryDsn,
        tracesSampleRate: 1.0,
        environment: process.env.NODE_ENV,
      });
      // Attach request handler middleware as early as possible
      app.use(Sentry.Handlers.requestHandler());
      console.log('Sentry error monitoring initialized');
    }
  } catch (err) {
    console.warn('Failed to initialize Sentry:', err);
  }
  // -----------------------------------------------------------------------

  // Initialize database before starting server
  console.log('Starting database initialization...');
  const dbInitialized = await initializeDatabase();
  
  if (dbInitialized) {
    console.log('Database initialization successful - full functionality available');
  } else {
    console.log('Database initialization failed - retrying during runtime operations');
  }

  const server = await registerRoutes(app);

  // If Sentry is enabled, attach the error handler after routes.  This
  // middleware will capture exceptions and forward them to Sentry before
  // passing them on.  Only register it when Sentry has been initialized.
  if (Sentry.getCurrentHub().getClient()) {
    app.use(Sentry.Handlers.errorHandler());
  }

  // Fallback error handler that formats errors as JSON.  Sentry's error
  // handler will run before this if enabled.
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    // Respond with JSON error message
    res.status(status).json({ message });
    // Re-throw the error to allow default Node handlers to log it
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
