import winston from 'winston';
import path from 'path';
import os from 'os';

/**
 * Determine the directory where log files should be stored.
 *
 * In production environments the current working directory (`/app` inside
 * the Docker container) may not be writable. Attempting to create a
 * directory there (e.g. `/app/logs`) will cause a permissions error like
 * `EACCES: permission denied, mkdir '/app/logs'`. To avoid this we allow
 * the log directory to be configured via the `LOG_DIR` environment
 * variable. When not provided we fall back to a directory in the
 * operating system's temporary folder. On development setups (when
 * `NODE_ENV` is not 'production') the existing behaviour of writing to
 * `./logs` relative to the project root is preserved.
 */
const defaultLogDir = process.env.NODE_ENV === 'production'
  ? path.join(os.tmpdir(), 'thronixpro-logs')
  : path.join(process.cwd(), 'logs');

// Resolve LOG_DIR from the environment or use the default
const logsDir = process.env.LOG_DIR
  ? path.resolve(process.env.LOG_DIR)
  : defaultLogDir;

// Create formatters
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}] ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// Main application logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'thronixpro' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),
    
    // File transports for production
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    })
  ],
});

// Security-specific logger
export const securityLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'thronixpro-security' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'security.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  ],
});

// Trading-specific logger for audit trail
export const tradingLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'thronixpro-trading' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'trading.log'),
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 20, // Keep more trading logs for audit
    })
  ],
});

// Performance logger
export const performanceLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'thronixpro-performance' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'performance.log'),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3,
    })
  ],
});

// Create logs directory if it doesn't exist. Surround with a try/catch
// so that the application still starts even if the directory cannot be
// created (for example due to permissions in the container). If the
// directory cannot be created the file transports will still attempt
// to write to the specified location; however when using the default
// temp-based directory this should succeed. If creation fails, the
// error is logged to the console.
import fs from 'fs';
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn(`Unable to create log directory at ${logsDir}:`, err);
}

// Handle uncaught exceptions and rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: path.join(logsDir, 'exceptions.log') })
);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Log application startup
logger.info('ThronixPRO logging system initialized', {
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  timestamp: new Date().toISOString()
});