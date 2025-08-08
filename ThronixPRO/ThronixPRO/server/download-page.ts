import { Router } from 'express';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

const router = Router();

// Serve a simple download page with direct links
router.get('/download-app', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ThronixPRO Download</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px;
            background: #0f172a;
            color: #e2e8f0;
        }
        .container {
            background: #1e293b;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        }
        h1 { 
            color: #38bdf8; 
            text-align: center;
            margin-bottom: 10px;
        }
        .subtitle {
            text-align: center;
            color: #94a3b8;
            margin-bottom: 30px;
        }
        .download-section {
            margin: 25px 0;
            padding: 20px;
            background: #334155;
            border-radius: 8px;
            border-left: 4px solid #38bdf8;
        }
        .download-link { 
            background: linear-gradient(135deg, #0ea5e9, #3b82f6);
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            display: inline-block; 
            margin: 8px 0;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .download-link:hover { 
            background: linear-gradient(135deg, #0284c7, #2563eb);
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(59, 130, 246, 0.3);
        }
        .file-info {
            color: #94a3b8;
            font-size: 14px;
            margin-top: 8px;
        }
        .direct-url {
            background: #1f2937;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
            color: #10b981;
            margin: 10px 0;
            word-break: break-all;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 5px 0;
            color: #cbd5e1;
        }
        .feature-list li:before {
            content: "✓ ";
            color: #10b981;
            font-weight: bold;
        }
        .warning {
            background: #fbbf24;
            color: #1f2937;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ThronixPRO Complete Platform</h1>
        <p class="subtitle">Professional Cryptocurrency Trading Platform</p>
        
        <div class="download-section">
            <h3>📦 Complete Application Package</h3>
            <a href="${baseUrl}/api/download/thronixpro-complete-app.zip" class="download-link">
                Download Complete Platform
            </a>
            <div class="file-info">
                File: thronixpro-complete-app.zip<br>
                Size: ~300MB (Complete with all dependencies)
            </div>
            <div class="direct-url">
                Direct URL: ${baseUrl}/api/download/thronixpro-complete-app.zip
            </div>
        </div>

        <div class="download-section">
            <h3>🚀 What's Included</h3>
            <ul class="feature-list">
                <li>Complete React TypeScript frontend</li>
                <li>Express.js backend with enterprise security</li>
                <li>Real-time cryptocurrency trading functionality</li>
                <li>PostgreSQL database schema and migrations</li>
                <li>Docker containerization files</li>
                <li>Live exchange integrations (KuCoin, Binance, Bybit)</li>
                <li>AI-powered trading bots</li>
                <li>Enterprise-grade security middleware</li>
                <li>Complete deployment documentation</li>
                <li>Production-ready configuration</li>
            </ul>
        </div>

        <div class="download-section">
            <h3>⚡ Quick Start</h3>
            <p>After downloading and extracting:</p>
            <div style="background: #1f2937; padding: 15px; border-radius: 6px; font-family: monospace; color: #10b981;">
npm install<br>
npm run dev
            </div>
        </div>

        <div class="warning">
            <strong>Production Ready:</strong> This package includes live trading capabilities with real exchange connections. Always test in a safe environment before deploying to production.
        </div>
    </div>
</body>
</html>
  `);
});

export default router;