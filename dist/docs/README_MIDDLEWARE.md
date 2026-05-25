# Middleware Setup Guide

This guide explains how to set up the backend middleware to protect your OpenWeather API key.

## Why Middleware?

Previously, the API key was stored in the browser's localStorage, which exposed it in the frontend code. Now, the API key is stored securely on the server and never exposed to the client.

## Quick Start

1. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example file
   cp ../env.example .env
   
   # Edit .env and add your OpenWeather API key
   OPENWEATHER_API_KEY=your_api_key_here
   ```

3. **Start the server:**
   ```bash
   # In the server directory
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

4. **Start the frontend (in a separate terminal):**
   ```bash
   # In the project root
   npm run dev
   ```

The Vite dev server is configured to proxy `/api` requests to the middleware server at `http://localhost:3001`.

## Production Deployment

### Option 1: Deploy Server Separately

Deploy the server to a hosting service (Heroku, Railway, Render, etc.) and update the frontend to use the production server URL.

### Option 2: Use Environment Variables

For production builds, you'll need to configure the API base URL:

```bash
# Set environment variable
VITE_API_BASE_URL=https://your-server.com

# Build
npm run build
```

Then update `vite.config.ts` to use the environment variable for the proxy target in production.

## API Endpoints

The middleware provides these endpoints:

- `GET /api/weather/forecast` - Get weather forecast
- `GET /api/weather/geocode` - Geocode city name to coordinates  
- `GET /api/weather/reverse-geocode` - Reverse geocode coordinates to city name

All endpoints require the OpenWeather API key to be set in the server's `.env` file.

## Security Notes

- ✅ API key is never exposed to the client
- ✅ API key is stored in server environment variables only
- ✅ `.env` file is gitignored
- ✅ CORS is configured for the frontend domain
- ✅ Server validates all requests before proxying

## Troubleshooting

**Server won't start:**
- Check that `OPENWEATHER_API_KEY` is set in `.env`
- Ensure port 3001 is not already in use

**Frontend can't connect to API:**
- Ensure the server is running on port 3001
- Check browser console for CORS errors
- Verify the proxy configuration in `vite.config.ts`

**API errors:**
- Verify your OpenWeather API key is valid
- Check that you have One Call API 3.0 subscription
- Review server logs for detailed error messages

