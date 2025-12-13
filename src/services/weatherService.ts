import { WeatherForecast, WeatherSummary, Location, RideConfig } from '../types';
import { storage } from '../utils/storage';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function fetchWeatherForecast(
  location: Location,
  config: RideConfig
): Promise<WeatherSummary> {
  const apiKey = storage.getApiKey();
  if (!apiKey) {
    throw new Error('OpenWeather API key not configured');
  }

  // Check cache (keyed by location, start time, and duration)
  // Round start time to nearest hour for cache key to avoid too many cache entries
  // Round coordinates to 1 decimal place to match the rounding done in Home.tsx
  const startTimeRounded = Math.floor(config.startTime.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000);
  // Normalize durationHours to avoid precision issues (e.g., 2.0 vs 2)
  const durationNormalized = Math.round(config.durationHours * 10) / 10;
  const cacheKey = `${location.lat.toFixed(1)},${location.lon.toFixed(1)},${startTimeRounded},${durationNormalized}`;
  const cached = storage.getWeatherCache(cacheKey);
  
  // Use cache if it exists and is still valid (not expired)
  // If cache is expired or doesn't exist, make an API call
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  // Fetch from API
  const units = config.units === 'imperial' ? 'imperial' : 'metric';
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${location.lat}&lon=${location.lon}&units=${units}&exclude=current,minutely,daily,alerts&appid=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || 'Invalid API key or subscription required';
      throw new Error(
        `API Error (401): ${errorMessage}. One Call API 3.0 requires a subscription. Please subscribe at https://openweathermap.org/api/one-call-3`
      );
    }
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Weather API error (${response.status}): ${errorText}`);
  }

  const data: WeatherForecast = await response.json();

  // Calculate ride window
  const startTime = config.startTime.getTime() / 1000;
  const endTime = startTime + config.durationHours * 3600;

  // Filter hourly data for ride window
  const rideHours = data.hourly.filter(
    (hour) => hour.dt >= startTime && hour.dt <= endTime
  );

  if (rideHours.length === 0) {
    throw new Error('No weather data available for ride window');
  }

  // Compute summary
  const summary: WeatherSummary = {
    minTemp: Math.min(...rideHours.map((h) => h.temp)),
    maxTemp: Math.max(...rideHours.map((h) => h.temp)),
    minFeelsLike: Math.min(...rideHours.map((h) => h.feels_like)),
    maxWindSpeed: Math.max(...rideHours.map((h) => h.wind_speed)),
    maxRainProbability: Math.max(...rideHours.map((h) => h.pop)),
    maxPrecipitationIntensity: Math.max(
      ...rideHours.map((h) => h.rain?.['1h'] || 0)
    ),
  };

  // Cache the result (keyed by location, start time, and duration)
  storage.setWeatherCache(summary, cacheKey);

  return summary;
}

export async function geocodeCity(cityName: string): Promise<Location> {
  const apiKey = storage.getApiKey();
  if (!apiKey) {
    throw new Error('OpenWeather API key not configured');
  }

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    throw new Error('City not found');
  }

  // Round coordinates to 1 decimal place (~11km precision) for consistent caching
  return {
    lat: Math.round(data[0].lat * 10) / 10,
    lon: Math.round(data[0].lon * 10) / 10,
    city: data[0].name,
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

  const apiKey = storage.getApiKey();
  if (!apiKey) {
    return null; // Silently fail if no API key
  }

  try {
    // Use precise coordinates for API call, but cache with 2 decimal places
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      return null;
    }

    // Cache the result with rounded coordinates
    const cityName = data[0].name || null;
    if (cityName) {
      storage.setGeocodeCache(roundedLat, roundedLon, cityName);
    }
    
    return cityName;
  } catch {
    return null;
  }
}

