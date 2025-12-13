#!/bin/bash

# DressMyRide - GitHub Pages Deployment Script
# This script builds the project and deploys it to GitHub Pages

set -e  # Exit on error

echo "🚀 Starting deployment to GitHub Pages..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
  echo "❌ Build failed: dist directory not found"
  exit 1
fi

echo "✅ Build successful!"

# Deploy to GitHub Pages
echo "🌐 Deploying to GitHub Pages..."
npx gh-pages -d dist

echo "✅ Deployment complete!"
echo "🌍 Your app should be live at: https://phasic.github.io/DressMyRide/"

