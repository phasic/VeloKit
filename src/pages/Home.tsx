import { useState, useEffect } from 'react';
import { Location, RideConfig, WeatherSummary, ClothingRecommendation } from '../types';
import { storage } from '../utils/storage';
import { fetchWeatherForecast } from '../services/weatherService';
import { recommendClothing } from '../logic/clothingEngine';

interface HomeProps {
  onLocationFound: (location: Location) => void;
  onManualInput: () => void;
  onQuickRecommendation: (
    location: Location,
    weather: WeatherSummary,
    recommendation: ClothingRecommendation,
    config: RideConfig
  ) => void;
}

export function Home({ onLocationFound, onManualInput, onQuickRecommendation }: HomeProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickViewData, setQuickViewData] = useState<{
    weather: WeatherSummary;
    recommendation: ClothingRecommendation;
    config: RideConfig;
  } | null>(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);

  const loadQuickView = async () => {
    setQuickViewLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported. Quick view requires location access.');
      setQuickViewLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location: Location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };

          const config: RideConfig = {
            startTime: new Date(),
            durationHours: 2,
            units: storage.getUnits(),
          };

          const weather = await fetchWeatherForecast(location, config);
          const recommendation = recommendClothing(weather, config);

          setQuickViewData({ weather, recommendation, config });
          onQuickRecommendation(location, weather, recommendation, config);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load quick view');
        } finally {
          setQuickViewLoading(false);
        }
      },
      () => {
        setError('Location permission denied. Please enable location access for quick view.');
        setQuickViewLoading(false);
      }
    );
  };

  // Auto-load quick view on mount
  useEffect(() => {
    loadQuickView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUseLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationFound({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLoading(false);
      },
      () => {
        setError('Location permission denied. Please use manual input.');
        setLoading(false);
      }
    );
  };

  const isMetric = quickViewData?.config.units === 'metric';
  const tempUnit = isMetric ? '°C' : '°F';
  const windUnit = isMetric ? 'km/h' : 'mph';

  const formatTemp = (temp: number) => Math.round(temp) + tempUnit;
  const formatWind = (wind: number) => Math.round(wind) + ' ' + windUnit;

  return (
    <div className="page home">
      <p className="subtitle">Current conditions</p>

      {quickViewLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading weather data...</p>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {quickViewData && !quickViewLoading && (
        <div className="quick-view">
          <div className="quick-view-header">
            <h2>What to wear</h2>
            <div className="quick-weather-badge">
              {formatTemp(quickViewData.weather.minFeelsLike)}
            </div>
          </div>

          <div className="quick-clothing">
            <div className="quick-kit">
              <h3>Main kit</h3>
              <ul>
                {quickViewData.recommendation.mainKit.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {quickViewData.recommendation.accessories.length > 0 && (
              <div className="quick-accessories">
                <h3>Accessories</h3>
                <ul>
                  {quickViewData.recommendation.accessories.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="quick-weather-summary">
            <div className="quick-weather-item">
              <span>Temp:</span>
              <span>
                {formatTemp(quickViewData.weather.minTemp)} - {formatTemp(quickViewData.weather.maxTemp)}
              </span>
            </div>
            <div className="quick-weather-item">
              <span>Wind:</span>
              <span>{formatWind(quickViewData.weather.maxWindSpeed)}</span>
            </div>
            <div className="quick-weather-item">
              <span>Rain:</span>
              <span>{Math.round(quickViewData.weather.maxRainProbability * 100)}%</span>
            </div>
          </div>

          <div className="quick-view-actions">
            <button
              className="btn btn-primary"
              onClick={loadQuickView}
              disabled={quickViewLoading}
            >
              {quickViewLoading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleUseLocation}
              disabled={loading}
            >
              {loading ? 'Getting location...' : 'Custom ride'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={onManualInput}
              disabled={loading}
            >
              Enter city manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

