#!/bin/bash

# Railway Deployment Script for Sebenza AI
echo "🚂 Deploying Sebenza AI to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Create new project or link existing
echo "📦 Setting up Railway project..."
if [ ! -f "railway.json" ]; then
    railway init
else
    echo "✅ Railway project already configured"
fi

# Set environment variables
echo "🔧 Setting up environment variables..."
echo "Please set the following variables in your Railway dashboard:"
echo "- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "- CLERK_SECRET_KEY"
echo "- OPENAI_API_KEY"
echo "- DATABASE_URL (if using PostgreSQL)"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your app will be available at the URL shown above"
echo "📊 Monitor your deployment: https://railway.app/dashboard"
