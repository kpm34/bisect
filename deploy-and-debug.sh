#!/bin/bash

# Deploy and Debug Script for Unified 3D Creator
# This script helps deploy to Vercel and fetch build logs

set -e

echo "🚀 Unified 3D Creator - Deploy & Debug Script"
echo "=============================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
else
    echo "✅ Vercel CLI already installed"
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
else
    echo "✅ Already logged in to Vercel"
    vercel whoami
fi

echo ""
echo "📤 Deploying to Vercel..."
echo ""

# Deploy to Vercel (production)
vercel --prod

echo ""
echo "📋 To fetch build logs, run:"
echo "   vercel logs <deployment-url>"
echo ""
echo "Or check logs in Vercel dashboard:"
echo "   https://vercel.com/dashboard"

