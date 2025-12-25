# VeloKit Server Middleware

This is the backend middleware server that protects your OpenWeather API key by proxying API requests server-side.

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp ../env.example .env
   
   # Edit .env and add your OpenWeather API key
   OPENWEATHER_API_KEY=your_api_key_here
   ```

3. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

The server will run on `http://localhost:3001` by default.

## API Endpoints

### `GET /health`
Health check endpoint.

### `GET /api/weather/forecast`
Get weather forecast for a location.

**Query Parameters:**
- `lat` (required): Latitude
- `lon` (required): Longitude
- `units` (optional): `metric` or `imperial` (default: `metric`)
- `startTime` (optional): Start timestamp in seconds
- `durationHours` (optional): Duration in hours

### `GET /api/weather/geocode`
Geocode a city name to coordinates.

**Query Parameters:**
- `city` (required): City name

### `GET /api/weather/reverse-geocode`
Reverse geocode coordinates to city name.

**Query Parameters:**
- `lat` (required): Latitude
- `lon` (required): Longitude

## Environment Variables

- `OPENWEATHER_API_KEY`: Your OpenWeather API key (required)
- `PORT`: Server port (default: 3001)

## Security

- The API key is stored server-side only in environment variables
- Never commit `.env` file to version control
- The server validates all requests before proxying to OpenWeather API
- CORS is enabled for the frontend domain


