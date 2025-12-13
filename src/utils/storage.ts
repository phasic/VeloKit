import { WeatherSummary } from '../types';

const STORAGE_KEYS = {
  API_KEY: 'dressmyride_api_key',
  WEATHER_CACHE: 'dressmyride_weather_cache',
  UNITS: 'dressmyride_units',
  QUICK_VIEW: 'dressmyride_quick_view',
  THEME: 'dressmyride_theme',
  DATE_FORMAT: 'dressmyride_date_format',
  DEFAULT_DURATION: 'dressmyride_default_duration',
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

      getTheme: (): 'light' | 'dark' | 'system' => {
        const theme = localStorage.getItem(STORAGE_KEYS.THEME);
        return (theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system') as 'light' | 'dark' | 'system';
      },

      setTheme: (theme: 'light' | 'dark' | 'system'): void => {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
      },

      getDateFormat: (): 'custom' | 'system' => {
        const format = localStorage.getItem(STORAGE_KEYS.DATE_FORMAT);
        return (format === 'custom' || format === 'system' ? format : 'system') as 'custom' | 'system';
      },

      setDateFormat: (format: 'custom' | 'system'): void => {
        localStorage.setItem(STORAGE_KEYS.DATE_FORMAT, format);
      },

      getDefaultDuration: (): number => {
        const duration = localStorage.getItem(STORAGE_KEYS.DEFAULT_DURATION);
        const parsed = duration ? parseFloat(duration) : 2;
        return isNaN(parsed) || parsed <= 0 ? 2 : parsed;
      },

      setDefaultDuration: (duration: number): void => {
        localStorage.setItem(STORAGE_KEYS.DEFAULT_DURATION, duration.toString());
      },
    };

