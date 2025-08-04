# ThronixPRO Complete Source Code - Copy Instructions

## Core Project Files to Copy

### 1. Configuration Files (Root Directory)
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration  
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Styling configuration
- `components.json` - UI components config
- `drizzle.config.ts` - Database configuration
- `index.html` - Main HTML file with "ThronixPRO" title
- `.env.example` - Environment variables template
- `README.md` - Project documentation
- `DEPLOYMENT.md` - Deployment instructions

### 2. Backend Server Files (server/ directory)
- `server/index.ts` - Main server entry point
- `server/routes.ts` - API endpoints for trading, auth, market data
- `server/storage.ts` - Database interface and operations
- `server/db.ts` - Database connection (PostgreSQL)
- `server/exchange-service.ts` - Live exchange integrations (Binance, KuCoin, Bybit)
- `server/market-data-service.ts` - Real-time market data service
- `server/ai-trading-service.ts` - AI trading algorithms and learning
- `server/email-service.ts` - Email verification and password reset
- `server/seed.ts` - Database seeding
- `server/vite.ts` - Vite integration

### 3. Database Schema (shared/ directory)
- `shared/schema.ts` - Complete database schema with Drizzle ORM

### 4. Frontend Files (client/src/ directory)
Copy the entire `client/src/` directory which includes:

#### Core App Files:
- `client/src/App.tsx` - Main app router
- `client/src/main.tsx` - React entry point
- `client/src/index.css` - Global styles and CSS variables

#### Components:
- `client/src/components/ui/` - All Shadcn UI components
- `client/src/components/coingecko-style-chart.tsx` - Professional trading chart
- `client/src/components/trading-chart.tsx` - Enhanced chart component
- `client/src/components/ai-master-widget.tsx` - AI trading bot widget
- `client/src/components/exchange-connection-status.tsx` - Exchange status display
- All other components in `client/src/components/`

#### Pages:
- `client/src/pages/Dashboard.tsx` - Main dashboard
- `client/src/pages/Charts.tsx` - Chart page with professional trading chart
- `client/src/pages/Trading.tsx` - Live trading interface
- `client/src/pages/AdvancedTrading.tsx` - Professional trading features
- `client/src/pages/Login.tsx` - Authentication page
- `client/src/pages/Register.tsx` - User registration
- `client/src/pages/ForgotPassword.tsx` - Password reset
- `client/src/pages/ResetPassword.tsx` - Password reset form
- All other pages in `client/src/pages/`

#### Utilities and Hooks:
- `client/src/lib/` - Utility functions and query client
- `client/src/hooks/` - Custom React hooks

### 5. AI Service (ai_service/ directory)
- `ai_service/app.py` - Flask AI microservice
- `ai_service/requirements.txt` - Python dependencies
- `ai_service/start.sh` - AI service startup script

### 6. Docker and Deployment
- `Dockerfile` - Container configuration
- `docker-compose.prod.yml` - Production deployment

## Alternative Download Methods

### Method 1: Manual File Copy
1. Open each file in the Replit editor
2. Copy the content and paste into new files on your local machine
3. Maintain the same directory structure

### Method 2: Git Clone
If you have Git access:
```bash
git clone <your-replit-url>
```

### Method 3: Browser Save
1. Right-click on files in Replit file explorer
2. Select "Save As" or "Download" if available
3. Save each file maintaining the directory structure

## Key Features Included

✓ **Live Trading Platform** - Real exchange integrations (Binance, KuCoin, Bybit)
✓ **Professional Charts** - CoinGecko-style trading charts with real-time data
✓ **AI Trading Bots** - Machine learning algorithms for automated trading
✓ **Real-time Data** - Live market data feeds and WebSocket connections
✓ **User Authentication** - Email verification and password reset system
✓ **Database Integration** - PostgreSQL with Drizzle ORM
✓ **Responsive Design** - Mobile-optimized interface
✓ **Advanced Trading** - Professional trading features and risk management
✓ **Email Services** - Resend integration for notifications
✓ **Security** - JWT authentication and encrypted API key storage

## Environment Variables Needed

Copy these environment variables and add your own values:
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key_for_api_keys
RESEND_API_KEY=your_resend_email_api_key
AI_SERVICE_URL=http://localhost:5001
```

## Installation After Copy

1. Run `npm install` to install dependencies
2. Set up PostgreSQL database
3. Configure environment variables
4. Run `npm run db:push` to create database schema
5. Start with `npm run dev`

Your complete ThronixPRO live trading platform is ready!