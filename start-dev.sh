#!/bin/bash

# Start both frontend and backend servers
# This script starts the Express middleware server and the Vite dev server concurrently

echo "🚀 Starting VeloKit development servers..."
echo ""

# Check if .env exists in server directory
if [ ! -f "server/.env" ]; then
  echo "⚠️  Warning: server/.env not found!"
  echo "   Please create server/.env with your OPENWEATHER_API_KEY"
  echo "   You can copy env.example: cp env.example server/.env"
  echo ""
fi

# Start both servers using concurrently
npm run dev:all


