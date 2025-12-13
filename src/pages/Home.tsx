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
  weatherOverride?: Partial<WeatherSummary> | null;
}

export function Home({ onLocationFound, onManualInput, onQuickRecommendation, weatherOverride }: HomeProps) {
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
      setError('Geolocation is not supported by your browser.');
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

          let weather = await fetchWeatherForecast(location, config);
          
          // Apply weather override if in dev mode
          if (weatherOverride) {
            weather = { ...weather, ...weatherOverride };
          }
          
          const recommendation = recommendClothing(weather, config);

          setQuickViewData({ weather, recommendation, config });
          onQuickRecommendation(location, weather, recommendation, config);
          setError(null); // Clear any previous errors
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load quick view');
        } finally {
          setQuickViewLoading(false);
        }
      },
      () => {
        setError('Location permission denied. Quick view unavailable.');
        setQuickViewLoading(false);
      }
    );
  };

  // Auto-load quick view on mount and when override changes
  useEffect(() => {
    loadQuickView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weatherOverride]);

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

  // Helper function to determine emoji for clothing items
  const getItemEmoji = (item: string, weather: WeatherSummary, config: RideConfig): string => {
    const itemLower = item.toLowerCase();
    const isMetric = config.units === 'metric';
    const wind = isMetric ? weather.maxWindSpeed : weather.maxWindSpeed * 1.60934;

    // Wind-related items
    if (itemLower.includes('wind') || (itemLower.includes('vest') && wind > 20)) {
      return '💨'; // Wind emoji
    }

    // Rain-related items
    if (itemLower.includes('rain') || itemLower.includes('waterproof')) {
      return '🌧️'; // Rain emoji
    }

    // Everything else is temperature-related
    return '🌡️'; // Temperature gauge emoji
  };

  return (
    <div className="page home">
      <p className="subtitle">Current conditions</p>

      {quickViewLoading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading weather data...</p>
        </div>
      )}

      {error && !quickViewData && (
        <div className="error">
          {error}
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
            You can still use the app by entering a city manually or using custom ride options.
          </p>
        </div>
      )}

      {quickViewData && !quickViewLoading && (
        <div className="quick-view">
          <div className="quick-view-header">
            <h2>What to wear</h2>
            <div className="quick-weather-badge">
              {formatTemp(quickViewData.weather.minFeelsLike)}
            </div>
          </div>

          <div className="quick-clothing">
            {quickViewData.recommendation.head.length > 0 && (
              <div className="quick-kit">
                <h3>Head</h3>
                <ul>
                  {quickViewData.recommendation.head.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item, quickViewData.weather, quickViewData.config)}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quickViewData.recommendation.neckFace.length > 0 && (
              <div className="quick-kit">
                <h3>Neck / Face</h3>
                <ul>
                  {quickViewData.recommendation.neckFace.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item, quickViewData.weather, quickViewData.config)}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quickViewData.recommendation.chest.length > 0 && (
              <div className="quick-kit">
                <h3>Chest</h3>
                <ul>
                  {quickViewData.recommendation.chest.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item, quickViewData.weather, quickViewData.config)}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quickViewData.recommendation.legs.length > 0 && (
              <div className="quick-kit">
                <h3>Legs</h3>
                <ul>
                  {quickViewData.recommendation.legs.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item, quickViewData.weather, quickViewData.config)}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quickViewData.recommendation.hands.length > 0 && (
              <div className="quick-kit">
                <h3>Hands</h3>
                <ul>
                  {quickViewData.recommendation.hands.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item, quickViewData.weather, quickViewData.config)}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quickViewData.recommendation.feet.length > 0 && (
              <div className="quick-kit">
                <h3>Feet</h3>
                <ul>
                  {quickViewData.recommendation.feet.map((item, idx) => (
                    <li key={idx}>
                      <span className="item-emoji">{getItemEmoji(item, quickViewData.weather, quickViewData.config)}</span>
                      {item}
                    </li>
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

      {!quickViewData && !quickViewLoading && (
        <div className="quick-view-actions" style={{ marginTop: '2rem' }}>
          <button
            className="btn btn-primary"
            onClick={loadQuickView}
            disabled={quickViewLoading}
          >
            {quickViewLoading ? 'Loading...' : '🔄 Try quick view again'}
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
      )}
    </div>
  );
}

