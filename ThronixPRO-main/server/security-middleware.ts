import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { logger, securityLogger } from './logger';

// CSRF Protection for state-changing operations
export const csrfProtection = (req: any, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;
    
    if (!token || token !== sessionToken) {
      securityLogger.warn('CSRF token validation failed', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  next();
};

// Enhanced input validation
export const validateTradingInput = [
  body('symbol').trim().isLength({ min: 3, max: 20 }).matches(/^[A-Z0-9\/\-]+$/),
  body('amount').isFloat({ min: 0.00001 }).withMessage('Amount must be positive'),
  body('exchange').isIn(['kucoin', 'binance', 'bybit']).withMessage('Invalid exchange'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      securityLogger.warn('Trading input validation failed', {
        errors: errors.array(),
        ip: req.ip,
        userId: (req as any).user?.id
      });
      return res.status(400).json({ 
        error: 'Invalid trading parameters',
        details: errors.array()
      });
    }
    next();
  }
];

// API key encryption validation
export const validateApiKeyInput = [
  body('apiKey').isLength({ min: 10, max: 500 }).withMessage('Invalid API key format'),
  body('apiSecret').isLength({ min: 10, max: 500 }).withMessage('Invalid API secret format'),
  body('passphrase').optional().isLength({ max: 100 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      securityLogger.warn('API key validation failed', {
        errors: errors.array(),
        ip: req.ip,
        userId: (req as any).user?.id
      });
      return res.status(400).json({ 
        error: 'Invalid API credentials format',
        details: errors.array()
      });
    }
    next();
  }
];

// Authentication attempt monitoring
export const monitorAuthAttempts = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const statusCode = res.statusCode;
    const clientIP = req.ip;
    
    if (req.path.includes('/login') || req.path.includes('/register')) {
      if (statusCode === 401 || statusCode === 400) {
        securityLogger.warn('Failed authentication attempt', {
          ip: clientIP,
          path: req.path,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
      } else if (statusCode === 200) {
        securityLogger.info('Successful authentication', {
          ip: clientIP,
          path: req.path,
          userAgent: req.get('User-Agent')
        });
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Trading activity monitoring
export const monitorTradingActivity = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.includes('/trading') || req.path.includes('/orders')) {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const user = (req as any).user;
      if (user && res.statusCode === 200) {
        logger.info('Trading activity', {
          userId: user.id,
          action: req.method,
          endpoint: req.path,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
      }
      
      return originalSend.call(this, data);
    };
  }
  
  next();
};

// Enhanced rate limiting for different endpoint types
export const createRateLimiter = (
  windowMs: number = 15 * 60 * 1000,
  max: number = 100,
  message: string = 'Too many requests'
) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      securityLogger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      res.status(429).json({ error: message });
    }
  });
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};