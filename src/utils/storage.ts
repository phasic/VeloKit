import { WeatherSummary } from '../types';

const STORAGE_KEYS = {
  API_KEY: 'dressmyride_api_key',
  WEATHER_CACHE: 'dressmyride_weather_cache',
  UNITS: 'dressmyride_units',
  QUICK_VIEW: 'dressmyride_quick_view',
} as const;

export const storage = {
  getApiKey: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY);
  },

  setApiKey: (key: string): void => {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key);
  },

  getUnits: (): 'metric' | 'imperial' => {
    const units = localStorage.getItem(STORAGE_KEYS.UNITS);
    return (units === 'imperial' ? 'imperial' : 'metric') as 'metric' | 'imperial';
  },

  setUnits: (units: 'metric' | 'imperial'): void => {
    localStorage.setItem(STORAGE_KEYS.UNITS, units);
  },

  getWeatherCache: (locationKey?: string): { data: WeatherSummary; timestamp: number; locationKey?: string } | null => {
    const cached = localStorage.getItem(STORAGE_KEYS.WEATHER_CACHE);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached);
      // If location key is provided, only return cache if it matches
      if (locationKey && parsed.locationKey !== locationKey) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  setWeatherCache: (data: WeatherSummary, locationKey?: string): void => {
    const cache = {
      data,
      timestamp: Date.now(),
      locationKey,
    };
    localStorage.setItem(STORAGE_KEYS.WEATHER_CACHE, JSON.stringify(cache));
  },

  clearWeatherCache: (): void => {
    localStorage.removeItem(STORAGE_KEYS.WEATHER_CACHE);
  },

  getQuickView: (): boolean => {
    const value = localStorage.getItem(STORAGE_KEYS.QUICK_VIEW);
    return value === 'true';
  },

  setQuickView: (enabled: boolean): void => {
    localStorage.setItem(STORAGE_KEYS.QUICK_VIEW, enabled ? 'true' : 'false');
  },
};

