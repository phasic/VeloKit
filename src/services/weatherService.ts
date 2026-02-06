import { WeatherForecast, WeatherSummary, Location, RideConfig } from '../types';
import { storage } from '../utils/storage';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

function shouldUseDirectOpenWeather(): boolean {
  return storage.getWeatherApiMode() === 'direct';
}

function getOpenWeatherApiKeyOrThrow(): string {
  const key = storage.getApiKey();
  if (!key || !key.trim()) {
    throw new Error('OpenWeather API key not configured. Go to Settings → Weather API to enter your key.');
  }
  return key.trim();
}

// Get API base URL dynamically based on dev tools selection
function getApiBaseUrl(): string {
  const apiServer = storage.getApiServer();
  const productionUrl = import.meta.env.VITE_API_BASE_URL || 'https://velokit-production.up.railway.app';
  const isDev = import.meta.env.DEV;
  
  if (apiServer === 'local') {
    if (isDev) {
      return ''; // Empty string uses Vite proxy in dev mode
    } else {
      return 'http://localhost:3001'; // Direct localhost in production build
    }
  }
  
  return productionUrl;
}

export async function fetchWeatherForecast(
  location: Location,
  config: RideConfig
): Promise<WeatherSummary> {
  // Check cache (keyed by location, start time, and duration)
  // Round start time to nearest hour for cache key to avoid too many cache entries
  // Round coordinates to 1 decimal place to match the rounding done in Home.tsx
  const startTimeRounded = Math.floor(config.startTime.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000);
  // Normalize durationHours to avoid precision issues (e.g., 2.0 vs 2)
  const durationNormalized = Math.round(config.durationHours * 10) / 10;
  const cacheKey = `${location.lat.toFixed(1)},${location.lon.toFixed(1)},${startTimeRounded},${durationNormalized}`;
  const cached = storage.getWeatherCache(cacheKey);
  
  // Use cache if it exists and is still valid (not expired) and has hourly data
  // If cache is expired, doesn't exist, or lacks hourly data, make an API call
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION && cached.data.hourly && cached.data.hourly.length > 0) {
    return cached.data;
  }

  // Fetch from middleware API (API key is handled server-side) or directly from OpenWeather (user-provided key)
  const units = config.units === 'imperial' ? 'imperial' : 'metric';
  const startTime = Math.floor(config.startTime.getTime() / 1000);
  const endTime = startTime + (config.durationHours * 3600);

  let url: string;
  if (shouldUseDirectOpenWeather()) {
    const apiKey = getOpenWeatherApiKeyOrThrow();
    url = `https://api.openweathermap.org/data/3.0/onecall?lat=${location.lat}&lon=${location.lon}&units=${units}&exclude=current,minutely,daily,alerts&appid=${apiKey}`;
  } else {
    const apiBaseUrl = getApiBaseUrl();
    url = `${apiBaseUrl}/api/weather/forecast?lat=${location.lat}&lon=${location.lon}&units=${units}&startTime=${startTime}&durationHours=${config.durationHours}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({} as any));
      const errorMessage = (errorData as any).message || 'Invalid API key or subscription required';
      throw new Error(
        `API Error (401): ${errorMessage}. One Call API 3.0 requires a subscription. Please subscribe at https://openweathermap.org/api/one-call-3`
      );
    }
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Weather API error (${response.status}): ${errorText}`);
  }

  const data: WeatherForecast = await response.json();

  // Middleware filters hourly data; direct OpenWeather does not. Filter either way to be safe.
  const hourly = data.hourly || [];
  const rideHours = hourly.filter((h) => h.dt >= startTime && h.dt <= endTime);

  if (rideHours.length === 0) {
    throw new Error('No weather data available for ride window');
  }

  // Normalize all values to metric for internal storage
  // Convert from imperial if API returned imperial
  const isImperial = units === 'imperial';
  const convertTemp = (f: number) => isImperial ? (f - 32) * 5/9 : f;
  const convertWind = (mph: number) => isImperial ? mph * 1.60934 : mph;

  // Compute summary (normalized to metric)
  const summary: WeatherSummary = {
    minTemp: Math.min(...rideHours.map((h) => convertTemp(h.temp))),
    maxTemp: Math.max(...rideHours.map((h) => convertTemp(h.temp))),
    minFeelsLike: Math.min(...rideHours.map((h) => convertTemp(h.feels_like))),
    maxFeelsLike: Math.max(...rideHours.map((h) => convertTemp(h.feels_like))),
    maxWindSpeed: Math.max(...rideHours.map((h) => convertWind(h.wind_speed))),
    maxRainProbability: Math.max(...rideHours.map((h) => h.pop)),
    maxPrecipitationIntensity: Math.max(
      ...rideHours.map((h) => h.rain?.['1h'] || 0)
    ),
    // Include hourly data for charts (normalized to metric)
    hourly: rideHours.map((h) => ({
      dt: h.dt,
      temp: convertTemp(h.temp),
      feels_like: convertTemp(h.feels_like),
      wind_speed: convertWind(h.wind_speed),
      pop: h.pop,
      rain: h.rain,
    })),
  };

  // Cache the result (keyed by location, start time, and duration)
  storage.setWeatherCache(summary, cacheKey);

  return summary;
}

export async function geocodeCity(cityName: string): Promise<Location> {
  let url: string;
  if (shouldUseDirectOpenWeather()) {
    const apiKey = getOpenWeatherApiKeyOrThrow();
    url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${apiKey}`;
  } else {
    const apiBaseUrl = getApiBaseUrl();
    url = `${apiBaseUrl}/api/weather/geocode?city=${encodeURIComponent(cityName)}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Geocoding API error: ${response.statusText}`);
  }

  const data = await response.json();
  // Middleware returns a single object; OpenWeather returns an array.
  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    throw new Error('City not found');
  }

  // Round coordinates to 1 decimal place (~11km precision) for consistent caching
  return {
    lat: Math.round(result.lat * 10) / 10,
    lon: Math.round(result.lon * 10) / 10,
    city: result.name,
  };
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  // Round coordinates to 2 decimal places (~1.1km precision) for geocoding cache
  // This is more precise than weather cache (1 decimal = ~11km) to get correct town
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;
  
  // Check cache first
  const cached = storage.getGeocodeCache(roundedLat, roundedLon);
  if (cached) {
    return cached;
  }

  try {
    // Use precise coordinates for API call, but cache with 2 decimal places
    let url: string;
    if (shouldUseDirectOpenWeather()) {
      const apiKey = getOpenWeatherApiKeyOrThrow();
      url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    } else {
      const apiBaseUrl = getApiBaseUrl();
      url = `${apiBaseUrl}/api/weather/reverse-geocode?lat=${lat}&lon=${lon}`;
    }
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const result = Array.isArray(data) ? data[0] : data;
    const cityName = (result && result.name) ? result.name : null;
    
    // Cache the result with rounded coordinates
    if (cityName) {
      storage.setGeocodeCache(roundedLat, roundedLon, cityName);
    }
    
    return cityName;
  } catch {
    return null;
  }
}

