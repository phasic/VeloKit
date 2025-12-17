import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Allow CORS from common frontend domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://phasic.github.io',
  process.env.FRONTEND_URL // Allow custom frontend URL via env var
].filter(Boolean);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // In development, allow all origins; in production, check allowed list
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Rate limiting configuration
// General API rate limiter: 100 requests per day per IP
const generalLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours (1 day)
  max: 100, // Limit each IP to 100 requests per day
  message: {
    error: 'Too many requests',
    message: 'Daily request limit exceeded. You have used all 100 requests for today. Please try again tomorrow.',
    retryAfter: '24 hours'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Weather forecast uses the same daily limit
const weatherForecastLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours (1 day)
  max: 100, // Limit each IP to 100 weather forecast requests per day
  message: {
    error: 'Too many weather requests',
    message: 'Daily request limit exceeded. You have used all 100 requests for today. Please try again tomorrow.',
    retryAfter: '24 hours'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter to all API routes
app.use('/api', generalLimiter);

// Get API key from environment variable
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

if (!OPENWEATHER_API_KEY) {
  console.warn('⚠️  WARNING: OPENWEATHER_API_KEY not set in environment variables');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Proxy endpoint for weather forecast (One Call API 3.0)
// Apply stricter rate limiting for expensive weather API calls
app.get('/api/weather/forecast', weatherForecastLimiter, async (req, res) => {
  try {
    if (!OPENWEATHER_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured on server',
        message: 'Please configure OPENWEATHER_API_KEY environment variable'
      });
    }

    const { lat, lon, units = 'metric', startTime, durationHours } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing required parameters: lat, lon' });
    }

    // Build OpenWeather API URL
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=${units}&exclude=current,minutely,daily,alerts&appid=${OPENWEATHER_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      // OpenWeather API returns error details in the response body
      const errorMessage = data.message || data.cod || response.statusText;
      return res.status(response.status).json({
        error: 'Weather API error',
        message: errorMessage,
        status: response.status
      });
    }

    // If startTime and durationHours are provided, filter the hourly data
    if (startTime && durationHours) {
      const startTimestamp = parseInt(startTime);
      const duration = parseFloat(durationHours);
      const endTimestamp = startTimestamp + (duration * 3600);

      if (data.hourly) {
        data.hourly = data.hourly.filter(
          (hour) => hour.dt >= startTimestamp && hour.dt <= endTimestamp
        );
      }

      if (!data.hourly || data.hourly.length === 0) {
        return res.status(404).json({ 
          error: 'No weather data available for ride window' 
        });
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Weather forecast error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Proxy endpoint for geocoding (city name to coordinates)
app.get('/api/weather/geocode', async (req, res) => {
  try {
    if (!OPENWEATHER_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured on server',
        message: 'Please configure OPENWEATHER_API_KEY environment variable'
      });
    }

    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'Missing required parameter: city' });
    }

    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OPENWEATHER_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      // OpenWeather API returns error details in the response body
      const errorMessage = data.message || data.cod || response.statusText;
      return res.status(response.status).json({
        error: 'Geocoding API error',
        message: errorMessage,
        status: response.status
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Proxy endpoint for reverse geocoding (coordinates to city name)
app.get('/api/weather/reverse-geocode', async (req, res) => {
  try {
    if (!OPENWEATHER_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured on server',
        message: 'Please configure OPENWEATHER_API_KEY environment variable'
      });
    }

    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Missing required parameters: lat, lon' });
    }

    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${OPENWEATHER_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      // OpenWeather API returns error details in the response body
      const errorMessage = data.message || data.cod || response.statusText;
      return res.status(response.status).json({
        error: 'Reverse geocoding API error',
        message: errorMessage,
        status: response.status
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ name: data[0].name || null });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Weather API proxy ready`);
  console.log(`🛡️  Rate limiting enabled:`);
  console.log(`   - All API endpoints: 100 requests per day per IP`);
  if (!OPENWEATHER_API_KEY) {
    console.warn('⚠️  Set OPENWEATHER_API_KEY environment variable to enable API calls');
  }
});

