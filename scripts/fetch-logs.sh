#!/bin/bash

# Fetch Vercel Build Logs Script
# Usage: ./fetch-logs.sh [deployment-url]

set -e

if [ -z "$1" ]; then
    echo "📋 Fetching recent deployments..."
    echo ""
    vercel ls
    
    echo ""
    echo "Usage: ./fetch-logs.sh <deployment-url>"
    echo "Or: vercel logs <deployment-url>"
    echo ""
    echo "To get build logs for a specific deployment:"
    echo "  vercel logs <deployment-url> --follow"
    echo ""
    echo "To get logs for production:"
    echo "  vercel logs --follow"
    exit 0
fi

DEPLOYMENT_URL=$1

echo "📋 Fetching logs for: $DEPLOYMENT_URL"
echo ""

# Fetch logs
vercel logs "$DEPLOYMENT_URL" --follow

