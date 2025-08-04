#!/bin/bash

# Fresh Git Setup for ThronixPRO
echo "Setting up fresh Git repository for ThronixPRO..."

# Remove existing git repository (run this manually if needed)
echo "To remove existing Git repo, run manually in shell:"
echo "rm -rf .git"
echo ""

# Initialize new Git repository
echo "git init"
echo "git branch -M main"
echo ""

# Add GitHub remote
echo "git remote add origin https://github.com/FLEM1998/ThronixPRO.git"
echo ""

# Stage all files
echo "git add ."
echo ""

# Create comprehensive commit
echo 'git commit -m "Complete ThronixPRO Enterprise Trading Platform

Features:
- React TypeScript frontend with Shadcn/UI components
- Express.js backend with enterprise security middleware  
- Live cryptocurrency trading (KuCoin, Binance, Bybit)
- PostgreSQL database with Drizzle ORM
- AI-powered trading bots with machine learning
- Real-time WebSocket market data streaming
- Docker containerization for production deployment
- Comprehensive Jest testing suite
- Enterprise-grade security and rate limiting
- Complete documentation and deployment guides

Production-ready platform with live exchange connections - no synthetic data"'
echo ""

# Push to GitHub
echo "git push -u origin main --force"
echo ""

echo "=== Manual Steps ==="
echo "1. Run: rm -rf .git (manually in shell)"
echo "2. Copy and paste each command above"
echo "3. Or run this entire script manually"
echo ""
echo "Your ThronixPRO platform (4.3GB) will be pushed to GitHub"