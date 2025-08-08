# Copy Instructions for ThronixPRO

## Complete Source Code Transfer Guide

This document provides comprehensive instructions for copying, transferring, and deploying the complete ThronixPRO cryptocurrency trading platform source code.

## Pre-Copy Requirements

### System Requirements
- **Node.js**: Version 18+ 
- **PostgreSQL**: Version 13+
- **Git**: Latest version
- **Operating System**: Linux, macOS, or Windows with WSL2

### Required Accounts
- GitHub account for repository access
- PostgreSQL database (Neon, AWS RDS, or local)
- Exchange API accounts (KuCoin, Binance, Bybit)
- Email service (Resend or SendGrid)
- Optional: OpenAI API for AI features

## Source Code Copy Methods

### Method 1: Git Clone (Recommended)
```bash
# Clone the complete repository
git clone https://github.com/FLEM1998/ThronixPROapp.git
cd ThronixPROapp

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Method 2: Download ZIP Archive
1. Visit: https://github.com/FLEM1998/ThronixPROapp
2. Click "Code" → "Download ZIP"
3. Extract to desired location
4. Open terminal in extracted folder
5. Run `npm install`

### Method 3: Direct File Transfer
For air-gapped or restricted environments:
```bash
# Create archive of all source files
tar -czf thronixpro-source.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=logs \
    --exclude=data/users.json \
    .

# Transfer archive to target system
scp thronixpro-source.tar.gz user@target-server:/path/to/destination/

# Extract on target system
tar -xzf thronixpro-source.tar.gz
npm install
```

## Complete File Inventory

### Core Application Files
```
├── client/                    # React frontend application
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/            # Application pages
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utilities and helpers
│   └── index.html            # HTML template
├── server/                   # Node.js backend
│   ├── routes.ts             # API endpoints
│   ├── storage.ts            # Database operations
│   ├── ai-trading-service.ts # AI trading logic
│   ├── exchange-service.ts   # Exchange integrations
│   └── security-middleware.ts # Security layer
├── shared/                   # Shared types and schemas
│   └── schema.ts             # Database schema definitions
└── package.json              # Dependencies and scripts
```

### Configuration Files
```
├── .env.example              # Environment variables template
├── drizzle.config.ts         # Database configuration
├── tailwind.config.ts        # CSS framework configuration
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Build tool configuration
└── components.json           # UI component configuration
```

### Documentation Files
```
├── README.md                 # Project overview and setup
├── DEPLOYMENT.md             # Deployment instructions
├── SECURITY.md               # Security guidelines
├── AI_SERVICE_SETUP.md       # AI service configuration
├── MOBILE_IAP_SETUP.md       # Mobile app setup
├── COPYRIGHT.txt             # Copyright information
└── replit.md                 # Development guidelines
```

### Deployment Files
```
├── Dockerfile                # Container configuration
├── docker-compose.yml        # Multi-container setup
├── docker-compose.prod.yml   # Production deployment
├── nginx.conf                # Reverse proxy configuration
├── ecosystem.config.js       # PM2 process management
└── .replit                   # Replit configuration
```

### AI and Microservices
```
├── ai_service/               # Flask AI microservice
│   ├── app.py               # Main AI application
│   ├── model_trainer.py     # ML model training
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # AI service container
└── iap_services/            # Mobile IAP services
    ├── huawei/              # Huawei AppGallery integration
    └── samsung/             # Samsung Galaxy Store integration
```

## Environment Configuration

### Required Environment Variables
Create `.env` file with the following variables:
```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Security Keys
JWT_SECRET=your-secure-jwt-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key

# Email Service (Optional)
RESEND_API_KEY=your-resend-api-key

# AI Service (Optional)
OPENAI_API_KEY=your-openai-api-key

# Exchange APIs (At least one required)
KUCOIN_API_KEY=your-kucoin-api-key
KUCOIN_SECRET_KEY=your-kucoin-secret-key
KUCOIN_PASSPHRASE=your-kucoin-passphrase

BINANCE_API_KEY=your-binance-api-key
BINANCE_SECRET_KEY=your-binance-secret-key

BYBIT_API_KEY=your-bybit-api-key
BYBIT_SECRET_KEY=your-bybit-secret-key

# Application Configuration
NODE_ENV=development
PORT=5000
```

### Database Setup
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb thronixpro
sudo -u postgres createuser thronixpro_user

# Push database schema
npm run db:push
```

## Deployment Instructions

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access application at http://localhost:5000
```

### Production Deployment

#### Option 1: Docker Deployment
```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml up -d

# Access application at http://localhost:5000
```

#### Option 2: Traditional Server
```bash
# Install PM2 process manager
npm install -g pm2

# Build production assets
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Setup nginx reverse proxy
sudo cp nginx.conf /etc/nginx/sites-available/thronixpro
sudo ln -s /etc/nginx/sites-available/thronixpro /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

#### Option 3: Cloud Platform
- **Replit**: Import repository and click "Run"
- **Railway**: Connect GitHub repository
- **Render**: Deploy from GitHub with auto-deployment
- **Vercel**: Frontend deployment (backend requires separate setup)

## Verification Steps

### 1. Installation Verification
```bash
# Check Node.js version
node --version  # Should be 18+

# Check dependencies
npm list

# Check TypeScript compilation
npm run build
```

### 2. Database Verification
```bash
# Test database connection
npm run db:push

# Check database tables
psql $DATABASE_URL -c "\dt"
```

### 3. Application Verification
```bash
# Start application
npm run dev

# Test endpoints
curl http://localhost:5000/api/health
curl http://localhost:5000/api/trading-pairs
```

### 4. Feature Testing
1. **Authentication**: Register and login
2. **Market Data**: Verify real-time price feeds
3. **Trading**: Test with small amounts
4. **AI Features**: Test strategy generation
5. **Security**: Verify rate limiting and CSRF protection

## Post-Copy Checklist

### Security Setup
- [ ] Change all default passwords and secrets
- [ ] Configure rate limiting and CSRF protection
- [ ] Set up SSL/TLS certificates
- [ ] Enable security headers
- [ ] Configure firewall rules

### Production Optimization
- [ ] Enable production logging
- [ ] Set up monitoring and alerting
- [ ] Configure database backups
- [ ] Implement health checks
- [ ] Set up error tracking

### Legal and Compliance
- [ ] Review and update terms of service
- [ ] Ensure regulatory compliance
- [ ] Configure audit logging
- [ ] Set up user data protection
- [ ] Document security procedures

## Troubleshooting Common Issues

### Installation Problems
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Fix permissions
sudo chown -R $USER:$GROUP ~/.npm
```

### Database Connection Issues
```bash
# Test database connectivity
pg_isready -d $DATABASE_URL

# Check connection string format
echo $DATABASE_URL

# Test manual connection
psql $DATABASE_URL
```

### Build Errors
```bash
# Check TypeScript errors
npx tsc --noEmit

# Clear build cache
rm -rf dist/
npm run build
```

## Support and Maintenance

### Getting Help
- **Documentation**: Review all `.md` files in repository
- **Issues**: Check GitHub Issues for known problems
- **Security**: Report security issues to legal@thronixpro.com

### Regular Maintenance
- **Weekly**: Update dependencies and security patches
- **Monthly**: Review logs and performance metrics
- **Quarterly**: Security audit and penetration testing

## Legal Notice

By copying and deploying this source code, you agree to:
- Comply with the MIT License terms
- Maintain copyright notices
- Follow applicable financial regulations
- Assume responsibility for trading activities

**Important**: This software facilitates real cryptocurrency trading. Users are responsible for their own trading decisions and financial outcomes.

---

**Copy Instructions Version**: 1.0  
**Last Updated**: August 2025  
**Support Contact**: legal@thronixpro.com