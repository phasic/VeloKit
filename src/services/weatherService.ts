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
  const startTimeRounded = Math.floor(config.startTime.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000);
  const cacheKey = `${location.lat.toFixed(2)},${location.lon.toFixed(2)},${startTimeRounded},${config.durationHours}`;
  const cached = storage.getWeatherCache(cacheKey);
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

  return {
    lat: data[0].lat,
    lon: data[0].lon,
    city: data[0].name,
  };
}

