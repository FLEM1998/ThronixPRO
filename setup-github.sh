#!/bin/bash

# ThronixPRO GitHub Setup Script
echo "Setting up GitHub repository for ThronixPRO..."

# Remove any existing remote origin
git remote remove origin 2>/dev/null || true

# Add GitHub remote
git remote add origin https://github.com/FLEM1998/ThronixPRO.git

# Verify remote
echo "Remote origin set to:"
git remote -v

# Check current branch
echo "Current branch:"
git branch

# Stage all files
echo "Staging all files..."
git add .

# Show status
echo "Git status:"
git status --short

# Create commit
echo "Creating commit..."
git commit -m "Push complete ThronixPRO Replit codebase - Enterprise trading platform

- Complete React TypeScript frontend with Shadcn/UI
- Express.js backend with enterprise security
- Real-time cryptocurrency trading functionality
- PostgreSQL database with Drizzle ORM
- Live exchange integrations (KuCoin, Binance, Bybit)
- AI-powered trading bots
- Docker containerization
- Production-ready deployment configuration
- Complete documentation and testing suite
- 931MB complete application package"

echo "Repository prepared for GitHub push!"
echo ""
echo "To push to GitHub, run:"
echo "git push -u origin main"