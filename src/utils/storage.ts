import { WeatherSummary } from '../types';

const STORAGE_KEYS = {
  API_KEY: 'dressmyride_api_key',
  WEATHER_CACHE: 'dressmyride_weather_cache',
  GEOCODE_CACHE: 'dressmyride_geocode_cache',
  UNITS: 'dressmyride_units',
  QUICK_VIEW: 'dressmyride_quick_view',
  THEME: 'dressmyride_theme',
  DATE_FORMAT: 'dressmyride_date_format',
  DEFAULT_DURATION: 'dressmyride_default_duration',
  DEMO_MODE: 'dressmyride_demo_mode',
  WELCOME_SEEN: 'dressmyride_welcome_seen',
  INSTALL_PROMPT_DISMISSED: 'dressmyride_install_prompt_dismissed',
  FORCE_INSTALL_PROMPT: 'dressmyride_force_install_prompt',
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

  getWeatherCache: (locationKey: string): { data: WeatherSummary; timestamp: number } | null => {
    const cached = localStorage.getItem(STORAGE_KEYS.WEATHER_CACHE);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached);
      
      // Handle migration from old format (single object with locationKey property)
      if (parsed.locationKey !== undefined && parsed.data !== undefined) {
        // Old format - migrate to new format
        const oldKey = parsed.locationKey;
        const cacheMap: Record<string, { data: WeatherSummary; timestamp: number }> = {
          [oldKey]: {
            data: parsed.data,
            timestamp: parsed.timestamp || Date.now(),
          }
        };
        localStorage.setItem(STORAGE_KEYS.WEATHER_CACHE, JSON.stringify(cacheMap));
        
        // Return if it matches the requested key
        if (locationKey === oldKey) {
          return cacheMap[oldKey];
        }
        return null;
      }
      
      // New format - cache map
      const cacheMap: Record<string, { data: WeatherSummary; timestamp: number }> = parsed;
      // Return the cache entry for this specific location key
      if (locationKey && cacheMap[locationKey]) {
        return cacheMap[locationKey];
      }
      return null;
    } catch {
      return null;
    }
  },

  setWeatherCache: (data: WeatherSummary, locationKey: string): void => {
    // Get existing cache map
    const cached = localStorage.getItem(STORAGE_KEYS.WEATHER_CACHE);
    let cacheMap: Record<string, { data: WeatherSummary; timestamp: number }> = {};
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        
        // Handle migration from old format
        if (parsed.locationKey !== undefined && parsed.data !== undefined) {
          // Old format - migrate to new format
          const oldKey = parsed.locationKey;
          cacheMap = {
            [oldKey]: {
              data: parsed.data,
              timestamp: parsed.timestamp || Date.now(),
            }
          };
        } else {
          // New format - already a map
          cacheMap = parsed;
        }
      } catch {
        // If parsing fails, start with empty map
        cacheMap = {};
      }
    }
    
    // Add or update the cache entry for this location key
    cacheMap[locationKey] = {
      data,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEYS.WEATHER_CACHE, JSON.stringify(cacheMap));
  },

  clearWeatherCache: (): void => {
    localStorage.removeItem(STORAGE_KEYS.WEATHER_CACHE);
  },

  getGeocodeCache: (lat: number, lon: number): string | null => {
    // Use 2 decimal places (~1.1km precision) for geocoding cache
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = localStorage.getItem(STORAGE_KEYS.GEOCODE_CACHE);
    if (!cached) return null;
    try {
      const cacheMap: Record<string, { city: string; timestamp: number }> = JSON.parse(cached);
      const entry = cacheMap[cacheKey];
      if (entry) {
        // Cache geocoding results for 24 hours (city names don't change often)
        const GEOCODE_CACHE_DURATION = 24 * 60 * 60 * 1000;
        if (Date.now() - entry.timestamp < GEOCODE_CACHE_DURATION) {
          return entry.city;
        }
      }
      return null;
    } catch {
      return null;
    }
  },

  setGeocodeCache: (lat: number, lon: number, city: string): void => {
    // Use 2 decimal places (~1.1km precision) for geocoding cache
    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    const cached = localStorage.getItem(STORAGE_KEYS.GEOCODE_CACHE);
    let cacheMap: Record<string, { city: string; timestamp: number }> = {};
    
    if (cached) {
      try {
        cacheMap = JSON.parse(cached);
      } catch {
        cacheMap = {};
      }
    }
    
    cacheMap[cacheKey] = {
      city,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEYS.GEOCODE_CACHE, JSON.stringify(cacheMap));
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

      getDemoMode: (): boolean => {
        const value = localStorage.getItem(STORAGE_KEYS.DEMO_MODE);
        return value === 'true';
      },

      setDemoMode: (enabled: boolean): void => {
        localStorage.setItem(STORAGE_KEYS.DEMO_MODE, enabled ? 'true' : 'false');
      },

      getWelcomeSeen: (): boolean => {
        return localStorage.getItem(STORAGE_KEYS.WELCOME_SEEN) === 'true';
      },

      setWelcomeSeen: (seen: boolean): void => {
        localStorage.setItem(STORAGE_KEYS.WELCOME_SEEN, seen ? 'true' : 'false');
      },

      getInstallPromptDismissed: (): number | null => {
        const value = localStorage.getItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED);
        return value ? parseInt(value, 10) : null;
      },

      setInstallPromptDismissed: (timestamp: number): void => {
        localStorage.setItem(STORAGE_KEYS.INSTALL_PROMPT_DISMISSED, timestamp.toString());
      },

      getForceInstallPrompt: (): boolean => {
        return localStorage.getItem(STORAGE_KEYS.FORCE_INSTALL_PROMPT) === 'true';
      },

      setForceInstallPrompt: (enabled: boolean): void => {
        localStorage.setItem(STORAGE_KEYS.FORCE_INSTALL_PROMPT, enabled ? 'true' : 'false');
      },
    };

