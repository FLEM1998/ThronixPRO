# Download Instructions - ThronixPRO

## Quick Download Guide

Follow these steps to download and set up the complete ThronixPRO cryptocurrency trading platform.

## Step 1: Download Source Code

### Option A: Direct ZIP Download (Easiest)
1. **Go to GitHub Repository**: https://github.com/FLEM1998/ThronixPROapp
2. **Click the green "Code" button**
3. **Select "Download ZIP"**
4. **Save the ZIP file** to your computer
5. **Extract the ZIP file** to your desired folder

### Option B: Git Clone (Recommended)
Open terminal and run:
```bash
git clone https://github.com/FLEM1998/ThronixPROapp.git
cd ThronixPROapp
```

## Step 2: Install Requirements

### System Requirements
Before installation, ensure you have:
- **Node.js** version 18 or higher
- **npm** (comes with Node.js)
- **PostgreSQL** database (local or cloud)

### Install Node.js (if needed)
- **Windows/Mac**: Download from https://nodejs.org
- **Linux**: 
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

## Step 3: Setup Project

Open terminal in the project folder and run:

```bash
# Install all dependencies
npm install

# Copy environment template
cp .env.example .env
```

## Step 4: Configure Environment

Edit the `.env` file with your settings:

### Required Settings
```bash
# Database (Required)
DATABASE_URL=postgresql://username:password@host:port/database

# Security Keys (Required)
JWT_SECRET=your-secure-random-string-here
ENCRYPTION_KEY=your-32-character-key-for-encryption
```

### Optional Settings
```bash
# Email Service (for password reset)
RESEND_API_KEY=your-resend-api-key

# AI Features (for advanced trading)
OPENAI_API_KEY=your-openai-api-key

# Exchange APIs (at least one recommended)
KUCOIN_API_KEY=your-kucoin-api-key
KUCOIN_SECRET_KEY=your-kucoin-secret-key
KUCOIN_PASSPHRASE=your-kucoin-passphrase
```

## Step 5: Database Setup

### Option A: Use Neon (Cloud PostgreSQL - Recommended)
1. **Sign up** at https://neon.tech
2. **Create a database**
3. **Copy connection string** to `DATABASE_URL` in `.env`

### Option B: Local PostgreSQL
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb thronixpro
sudo -u postgres createuser your_username

# Update DATABASE_URL in .env with your local connection
```

### Initialize Database
```bash
npm run db:push
```

## Step 6: Start Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The application will be available at: **http://localhost:5000**

## Verification Checklist

After setup, verify everything works:

- [ ] **Application starts** without errors
- [ ] **Homepage loads** at http://localhost:5000
- [ ] **Can register** a new user account
- [ ] **Can login** with created account
- [ ] **Market data loads** (live cryptocurrency prices)
- [ ] **Trading pairs display** correctly

## Common Issues and Solutions

### Issue: "Module not found"
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Database connection failed"
**Solution**: 
- Check `DATABASE_URL` in `.env` file
- Ensure database server is running
- Test connection: `psql $DATABASE_URL`

### Issue: "Port already in use"
**Solution**: 
- Change port in `.env`: `PORT=5001`
- Or kill process: `pkill -f node`

### Issue: "Permission denied"
**Solution**:
```bash
sudo chown -R $USER:$USER .
chmod -R 755 .
```

## Exchange API Setup (Optional)

To enable live trading features:

### KuCoin Setup
1. **Login to KuCoin**
2. **Go to API Management**
3. **Create API Key** with trading permissions
4. **Add credentials to `.env`**

### Binance Setup
1. **Login to Binance**
2. **Go to API Management**
3. **Create API Key** with spot trading
4. **Add credentials to `.env`**

## Security Setup

### Essential Security Steps
1. **Change default secrets** in `.env`
2. **Use strong passwords** for database
3. **Enable HTTPS** in production
4. **Set up firewall rules**
5. **Regular security updates**

### Production Deployment
For production deployment, see `DEPLOYMENT.md` for detailed instructions including:
- Docker deployment
- Cloud platform setup
- SSL/TLS configuration
- Performance optimization

## Getting Help

### Documentation
- **README.md**: Project overview
- **DEPLOYMENT.md**: Production deployment
- **SECURITY.md**: Security guidelines
- **AI_SERVICE_SETUP.md**: AI features setup

### Support Channels
- **GitHub Issues**: Bug reports and feature requests
- **Email**: legal@thronixpro.com
- **Repository**: https://github.com/FLEM1998/ThronixPROapp

## Legal Important Notice

**⚠️ FINANCIAL RISK WARNING**: This software enables real cryptocurrency trading with actual funds. Trading involves significant financial risk and may result in substantial losses. You are solely responsible for your trading decisions and outcomes.

**📋 REGULATORY COMPLIANCE**: Ensure compliance with your local laws and regulations regarding cryptocurrency trading before use.

**🔒 SECURITY**: Keep your API keys, passwords, and encryption keys secure. Never share them publicly.

---

**Download successful?** You should now have a fully functional ThronixPRO trading platform running locally! 

**Next steps**: Configure your exchange APIs and start exploring the advanced trading features and AI-powered strategies.

**Need help?** Check the documentation files or create an issue on GitHub.