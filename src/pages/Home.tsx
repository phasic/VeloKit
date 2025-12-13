import { useState, useEffect, useRef } from 'react';
import { Location, RideConfig, WeatherSummary, ClothingRecommendation } from '../types';
import { storage } from '../utils/storage';
import { fetchWeatherForecast, reverseGeocode } from '../services/weatherService';
import { recommendClothing } from '../logic/clothingEngine';
import { formatDateTime } from '../utils/dateFormat';
import { generateDemoWeather } from '../utils/demoWeather';

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

export function Home({ onQuickRecommendation, weatherOverride }: HomeProps) {
  const [error, setError] = useState<string | null>(null);
  const [quickViewData, setQuickViewData] = useState<{
    weather: WeatherSummary;
    recommendation: ClothingRecommendation;
    config: RideConfig;
    location: Location;
  } | null>(null);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [pullToRefresh, setPullToRefresh] = useState({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
  });
  const [touchStart, setTouchStart] = useState<{ y: number; scrollTop: number } | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const loadQuickView = async () => {
    setQuickViewLoading(true);
    setError(null);

    const isDemoMode = storage.getDemoMode();
    
    // In demo mode, we don't need geolocation
    if (isDemoMode) {
      try {
        const location: Location = {
          lat: 0, // Demo location
          lon: 0,
          city: 'Demo Location',
        };

        const config: RideConfig = {
          startTime: new Date(),
          durationHours: storage.getDefaultDuration(),
          units: storage.getUnits(),
        };

        let weather: WeatherSummary = generateDemoWeather();
        
        // Apply weather override if in dev mode
        if (weatherOverride) {
          weather = { ...weather, ...weatherOverride };
        }
        
        const recommendation = recommendClothing(weather, config);

        setQuickViewData({ weather, recommendation, config, location });
        onQuickRecommendation(location, weather, recommendation, config);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load demo weather');
      } finally {
        setQuickViewLoading(false);
      }
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setQuickViewLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use precise coordinates for location (for display and reverse geocoding)
          const location: Location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };

          // Try to get city name via reverse geocoding (uses 2 decimal places for better accuracy)
          const cityName = await reverseGeocode(location.lat, location.lon);
          if (cityName) {
            location.city = cityName;
          }

          const config: RideConfig = {
            startTime: new Date(),
            durationHours: storage.getDefaultDuration(),
            units: storage.getUnits(),
          };

          // Cache is automatically prioritized if valid, otherwise API call is made
          // fetchWeatherForecast will round coordinates to 1 decimal place for cache key
          let weather: WeatherSummary = await fetchWeatherForecast(location, config);
          
          // Apply weather override if in dev mode
          if (weatherOverride) {
            weather = { ...weather, ...weatherOverride };
          }
          
          const recommendation = recommendClothing(weather, config);

          setQuickViewData({ weather, recommendation, config, location });
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

  // Set up touch event listeners with passive: false
  useEffect(() => {
    const element = pageRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop === 0) {
        setTouchStart({
          y: e.touches[0].clientY,
          scrollTop: scrollTop,
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart) return;
      
      const currentY = e.touches[0].clientY;
      const pullDistance = Math.max(0, currentY - touchStart.y);
      
      if (pullDistance > 0) {
        setPullToRefresh({
          isPulling: true,
          pullDistance: Math.min(pullDistance, 80),
          isRefreshing: false,
        });
        
        if (pullDistance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (!touchStart) return;
      
      if (pullToRefresh.pullDistance > 50) {
        setPullToRefresh({
          isPulling: true,
          pullDistance: 60,
          isRefreshing: true,
        });
        loadQuickView();
        
        setTimeout(() => {
          setPullToRefresh({
            isPulling: false,
            pullDistance: 0,
            isRefreshing: false,
          });
        }, 800);
      } else {
        setPullToRefresh({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false,
        });
      }
      
      setTouchStart(null);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, pullToRefresh.pullDistance]);



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
    <div 
      ref={pageRef}
      className="page home"
      style={{
        transform: pullToRefresh.isPulling ? `translateY(${Math.min(pullToRefresh.pullDistance, 80)}px)` : 'translateY(0)',
        transition: pullToRefresh.isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
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
          {/* Pull-to-refresh indicator */}
          {pullToRefresh.isPulling && (
            <div 
              className="pull-to-refresh-indicator"
              style={{
                transform: `translateX(-50%)`,
                opacity: Math.min(pullToRefresh.pullDistance / 50, 1),
              }}
            >
              <img 
                src={`${import.meta.env.BASE_URL}refresh.png`} 
                alt="Refresh" 
                className={`pull-to-refresh-icon ${pullToRefresh.isRefreshing ? 'spinning' : ''}`}
              />
              <span className="pull-to-refresh-text">
                {pullToRefresh.isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
              </span>
            </div>
          )}
          <div className="quick-view-header">
            <div>
              <h2>What to wear</h2>
              <button
                className="refresh-btn desktop-only"
                onClick={loadQuickView}
                disabled={quickViewLoading}
                aria-label="Refresh"
              >
                <img 
                  src={`${import.meta.env.BASE_URL}refresh.png`} 
                  alt="Refresh" 
                  className="refresh-btn-icon"
                />
                <span>Refresh</span>
              </button>
            </div>
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

          <div className="weather-summary">
            <h3>Weather summary</h3>
            <div className="weather-grid">
              <div className="weather-item">
                <span className="label">Temperature:</span>
                <span className="value">
                  {formatTemp(quickViewData.weather.minTemp)} - {formatTemp(quickViewData.weather.maxTemp)}
                </span>
              </div>
              <div className="weather-item">
                <span className="label">Feels like:</span>
                <span className="value">{formatTemp(quickViewData.weather.minFeelsLike)}</span>
              </div>
              <div className="weather-item">
                <span className="label">Wind speed:</span>
                <span className="value">{formatWind(quickViewData.weather.maxWindSpeed)}</span>
              </div>
              <div className="weather-item">
                <span className="label">Rain probability:</span>
                <span className="value">{Math.round(quickViewData.weather.maxRainProbability * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="weather-summary">
            <h3>Ride details</h3>
            <div className="weather-grid">
              <div className="weather-item">
                <span className="label">Date/Time:</span>
                <span className="value">
                  {formatDateTime(new Date(quickViewData.config.startTime), storage.getDateFormat())}
                </span>
              </div>
              <div className="weather-item">
                <span className="label">Duration:</span>
                <span className="value">
                  {quickViewData.config.durationHours} {quickViewData.config.durationHours === 1 ? 'hour' : 'hours'}
                </span>
              </div>
              <div className="weather-item location-item">
                <span className="label">Location:</span>
                <span className="value">
                  {quickViewData.location.city ? (
                    <div>
                      <div>{quickViewData.location.city}</div>
                      <div className="location-coords">
                        {quickViewData.location.lat.toFixed(2)}, {quickViewData.location.lon.toFixed(2)}
                      </div>
                    </div>
                  ) : (
                    `${quickViewData.location.lat.toFixed(2)}, ${quickViewData.location.lon.toFixed(2)}`
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="explanation-section">
            <h3>Why?</h3>
            <ul>
              {quickViewData.recommendation.explanation.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>

        </div>
      )}

    </div>
  );
}

