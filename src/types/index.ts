export interface WeatherData {
  temp: number;
  feelsLike: number;
  windSpeed: number;
  pop: number; // probability of precipitation (0-1)
  rain?: {
    '1h': number; // precipitation intensity in mm
  };
}

export interface WeatherForecast {
  hourly: Array<{
    dt: number;
    temp: number;
    feels_like: number;
    wind_speed: number;
    pop: number;
    rain?: {
      '1h': number;
    };
  }>;
}

export interface WeatherSummary {
  minTemp: number;
  maxTemp: number;
  minFeelsLike: number;
  maxWindSpeed: number;
  maxRainProbability: number;
  maxPrecipitationIntensity: number;
}

export interface ClothingRecommendation {
  head: string[];
  neckFace: string[];
  chest: string[];
  legs: string[];
  hands: string[];
  feet: string[];
  explanation: string[];
}

export interface RideConfig {
  startTime: Date;
  durationHours: number;
  units: 'metric' | 'imperial';
}

export interface Location {
  lat: number;
  lon: number;
  city?: string;
}

export type Page = 'welcome' | 'home' | 'setup' | 'recommendation' | 'settings' | 'manual' | 'guide' | 'about';

