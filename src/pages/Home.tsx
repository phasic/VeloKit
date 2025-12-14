import { useState, useEffect, useRef, Fragment } from 'react';
import { Location, RideConfig, WeatherSummary, ClothingRecommendation } from '../types';
import { storage } from '../utils/storage';
import { fetchWeatherForecast, reverseGeocode } from '../services/weatherService';
import { recommendClothing } from '../logic/clothingEngine';
import { formatDateTime } from '../utils/dateFormat';
import { generateDemoWeather } from '../utils/demoWeather';
import { WeatherChart } from '../components/WeatherChart';

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

  // Helper function to determine font size for temperature range
  const getTemperatureFontSize = (min: number, max: number): string | undefined => {
    const minRounded = Math.round(min);
    const maxRounded = Math.round(max);
    // Check if both are double digits (absolute value >= 10)
    const bothNegativeDoubleDigits = minRounded <= -10 && maxRounded <= -10;
    const bothPositiveDoubleDigits = minRounded >= 10 && maxRounded >= 10;
    
    // Negative double digits need even smaller font due to minus sign
    if (bothNegativeDoubleDigits) {
      return '14px';
    }
    // Positive double digits use slightly larger font
    if (bothPositiveDoubleDigits) {
      return '16px';
    }
    return undefined;
  };

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
        let weather: WeatherSummary = generateDemoWeather(config.durationHours);
        
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

  // Helper function to determine item type
  const getItemType = (item: string | { options: string[][] }, weather: WeatherSummary, config: RideConfig): 'temp' | 'wind' | 'rain' => {
    // If it's an options object, check the first option's first item
    if (typeof item === 'object' && item !== null && 'options' in item) {
      const firstOptionFirstItem = item.options[0]?.[0];
      if (firstOptionFirstItem) {
        return getItemType(firstOptionFirstItem, weather, config);
      }
      return 'temp'; // Default if no items
    }
    
    const itemLower = typeof item === 'string' ? item.toLowerCase() : '';
    const isMetric = config.units === 'metric';
    const wind = isMetric ? weather.maxWindSpeed : weather.maxWindSpeed * 1.60934;

    // Wind-related items
    if (itemLower.includes('wind') || (itemLower.includes('vest') && wind > 20)) {
      return 'wind';
    }

    // Rain-related items
    if (itemLower.includes('rain') || itemLower.includes('waterproof')) {
      return 'rain';
    }

    // Everything else is temperature-related
    return 'temp';
  };

  // Helper function to get icon path for item type
  const getTypeIcon = (type: 'temp' | 'wind' | 'rain'): string => {
    switch (type) {
      case 'wind':
        return 'windy.png';
      case 'rain':
        return 'rainy.png';
      default:
        return 'temperature.png';
    }
  };

  // Helper function to group items by type
  const groupItemsByType = (items: (string | { options: string[][] })[], weather: WeatherSummary, config: RideConfig) => {
    const grouped: { type: 'temp' | 'wind' | 'rain'; items: (string | { options: string[][] })[] }[] = [];
    const tempItems: (string | { options: string[][] })[] = [];
    const windItems: (string | { options: string[][] })[] = [];
    const rainItems: (string | { options: string[][] })[] = [];

    items.forEach(item => {
      const type = getItemType(item, weather, config);
      if (type === 'wind') {
        windItems.push(item);
      } else if (type === 'rain') {
        rainItems.push(item);
      } else {
        tempItems.push(item);
      }
    });

    if (tempItems.length > 0) {
      grouped.push({ type: 'temp', items: tempItems });
    }
    if (windItems.length > 0) {
      grouped.push({ type: 'wind', items: windItems });
    }
    if (rainItems.length > 0) {
      grouped.push({ type: 'rain', items: rainItems });
    }

    return grouped;
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
            <div className="quick-weather-badges">
              <div 
                className="quick-weather-badge" 
                onClick={() => {
                  const rideDetailsElement = document.getElementById('ride-details');
                  if (rideDetailsElement) {
                    rideDetailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="badge-label">
                  <img 
                    src={`${import.meta.env.BASE_URL}palm.png`} 
                    alt="Feels like" 
                    className="badge-icon"
                  />
                </div>
                <div className="badge-value" style={{ fontSize: getTemperatureFontSize(quickViewData.weather.minFeelsLike, quickViewData.weather.maxFeelsLike) }}>
                {Math.round(quickViewData.weather.minFeelsLike) === Math.round(quickViewData.weather.maxFeelsLike) ? (
                  <>
                    {Math.round(quickViewData.weather.minFeelsLike)}<span className="badge-unit">{tempUnit}</span>
                  </>
                ) : (
                  <>
                    {Math.round(quickViewData.weather.minFeelsLike)}<span className="badge-unit">{tempUnit}</span> <span className="badge-dash">-</span> {Math.round(quickViewData.weather.maxFeelsLike)}<span className="badge-unit">{tempUnit}</span>
                  </>
                )}
              </div>
              </div>
              <div 
                className="quick-weather-badge"
                onClick={() => {
                  const rideDetailsElement = document.getElementById('ride-details');
                  if (rideDetailsElement) {
                    rideDetailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="badge-label">
                  <img 
                    src={`${import.meta.env.BASE_URL}temperature.png`} 
                    alt="Temperature" 
                    className="badge-icon"
                  />
                </div>
              <div className="badge-value" style={{ fontSize: getTemperatureFontSize(quickViewData.weather.minTemp, quickViewData.weather.maxTemp) }}>
                {Math.round(quickViewData.weather.minTemp) === Math.round(quickViewData.weather.maxTemp) ? (
                  <>
                    {Math.round(quickViewData.weather.minTemp)}<span className="badge-unit">{tempUnit}</span>
                  </>
                ) : (
                  <>
                    {Math.round(quickViewData.weather.minTemp)}<span className="badge-unit">{tempUnit}</span> <span className="badge-dash">-</span> {Math.round(quickViewData.weather.maxTemp)}<span className="badge-unit">{tempUnit}</span>
                  </>
                )}
              </div>
              </div>
              <div 
                className="quick-weather-badge"
                onClick={() => {
                  const rideDetailsElement = document.getElementById('ride-details');
                  if (rideDetailsElement) {
                    rideDetailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="badge-label">
                  <img 
                    src={`${import.meta.env.BASE_URL}windy.png`} 
                    alt="Wind" 
                    className="badge-icon"
                  />
                </div>
                <div className="badge-value">
                  <span style={{ fontSize: '11px', opacity: 0.7, marginRight: '2px' }}>max</span>
                  {Math.round(quickViewData.weather.maxWindSpeed)}<span className="badge-unit"> {windUnit}</span>
                </div>
              </div>
              <div 
                className="quick-weather-badge"
                onClick={() => {
                  const rideDetailsElement = document.getElementById('ride-details');
                  if (rideDetailsElement) {
                    rideDetailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="badge-label">
                  <img 
                    src={`${import.meta.env.BASE_URL}rainy.png`} 
                    alt="Rain" 
                    className="badge-icon"
                  />
                </div>
                <div className="badge-value">{Math.round(quickViewData.weather.maxRainProbability * 100)}%</div>
              </div>
            </div>
          </div>

          <div className="quick-clothing">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>What to wear</h3>
              <button
                className="refresh-btn desktop-only"
                onClick={loadQuickView}
                disabled={quickViewLoading}
                aria-label="Refresh"
                style={{ margin: 0 }}
              >
                <img 
                  src={`${import.meta.env.BASE_URL}refresh.png`} 
                  alt="Refresh" 
                  className="refresh-btn-icon"
                />
                <span>Refresh</span>
              </button>
            </div>
            {quickViewData.recommendation.head.length > 0 && (
              <div className="quick-kit">
                <h3>Head</h3>
                {groupItemsByType(quickViewData.recommendation.head, quickViewData.weather, quickViewData.config).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => {
                        // Check if this is an options group
                        if (typeof item === 'object' && item !== null && 'options' in item) {
                          const options = (item as { options: string[][] }).options;
                          return (
                            <Fragment key={idx}>
                              {options.map((optionItems, optionIdx) => (
                                <Fragment key={optionIdx}>
                                  {optionIdx > 0 && (
                                    <li key={`or-${optionIdx}`} className="option-divider">
                                      <span className="option-or">OR</span>
                                    </li>
                                  )}
                                  {optionItems.map((optionItem, itemIdx) => (
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {quickViewData.recommendation.neckFace.length > 0 && (
              <div className="quick-kit">
                <h3>Neck / Face</h3>
                {groupItemsByType(quickViewData.recommendation.neckFace, quickViewData.weather, quickViewData.config).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => {
                        // Check if this is an options group
                        if (typeof item === 'object' && item !== null && 'options' in item) {
                          const options = (item as { options: string[][] }).options;
                          return (
                            <Fragment key={idx}>
                              {options.map((optionItems, optionIdx) => (
                                <Fragment key={optionIdx}>
                                  {optionIdx > 0 && (
                                    <li key={`or-${optionIdx}`} className="option-divider">
                                      <span className="option-or">OR</span>
                                    </li>
                                  )}
                                  {optionItems.map((optionItem, itemIdx) => (
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {quickViewData.recommendation.chest.length > 0 && (
              <div className="quick-kit">
                <h3>Chest</h3>
                {groupItemsByType(quickViewData.recommendation.chest, quickViewData.weather, quickViewData.config).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => {
                        // Check if this is an options group
                        if (typeof item === 'object' && item !== null && 'options' in item) {
                          const options = (item as { options: string[][] }).options;
                          return (
                            <Fragment key={idx}>
                              {options.map((optionItems, optionIdx) => (
                                <Fragment key={optionIdx}>
                                  {optionIdx > 0 && (
                                    <li key={`or-${optionIdx}`} className="option-divider">
                                      <span className="option-or">OR</span>
                                    </li>
                                  )}
                                  {optionItems.map((optionItem, itemIdx) => (
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {quickViewData.recommendation.legs.length > 0 && (
              <div className="quick-kit">
                <h3>Legs</h3>
                {groupItemsByType(quickViewData.recommendation.legs, quickViewData.weather, quickViewData.config).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => {
                        // Check if this is an options group
                        if (typeof item === 'object' && item !== null && 'options' in item) {
                          const options = (item as { options: string[][] }).options;
                          return (
                            <Fragment key={idx}>
                              {options.map((optionItems, optionIdx) => (
                                <Fragment key={optionIdx}>
                                  {optionIdx > 0 && (
                                    <li key={`or-${optionIdx}`} className="option-divider">
                                      <span className="option-or">OR</span>
                                    </li>
                                  )}
                                  {optionItems.map((optionItem, itemIdx) => (
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {quickViewData.recommendation.hands.length > 0 && (
              <div className="quick-kit">
                <h3>Hands</h3>
                {groupItemsByType(quickViewData.recommendation.hands, quickViewData.weather, quickViewData.config).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => {
                        // Check if this is an options group
                        if (typeof item === 'object' && item !== null && 'options' in item) {
                          const options = (item as { options: string[][] }).options;
                          return (
                            <Fragment key={idx}>
                              {options.map((optionItems, optionIdx) => (
                                <Fragment key={optionIdx}>
                                  {optionIdx > 0 && (
                                    <li key={`or-${optionIdx}`} className="option-divider">
                                      <span className="option-or">OR</span>
                                    </li>
                                  )}
                                  {optionItems.map((optionItem, itemIdx) => (
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {quickViewData.recommendation.feet.length > 0 && (
              <div className="quick-kit">
                <h3>Feet</h3>
                {groupItemsByType(quickViewData.recommendation.feet, quickViewData.weather, quickViewData.config).map((group, groupIdx) => (
                  <div key={groupIdx} className="item-group">
                    <div className="item-group-icon-wrapper">
                      <img 
                        src={`${import.meta.env.BASE_URL}${getTypeIcon(group.type)}`}
                        alt=""
                        className="item-group-icon"
                      />
                    </div>
                    <ul className="item-group-list">
                      {group.items.map((item, idx) => {
                        // Check if this is an options group
                        if (typeof item === 'object' && item !== null && 'options' in item) {
                          const options = (item as { options: string[][] }).options;
                          return (
                            <Fragment key={idx}>
                              {options.map((optionItems, optionIdx) => (
                                <Fragment key={optionIdx}>
                                  {optionIdx > 0 && (
                                    <li key={`or-${optionIdx}`} className="option-divider">
                                      <span className="option-or">OR</span>
                                    </li>
                                  )}
                                  {optionItems.map((optionItem, itemIdx) => (
                                    <li key={`${optionIdx}-${itemIdx}`} className={optionIdx > 0 ? "option-item" : ""}>
                                      {optionItem}
                                    </li>
                                  ))}
                                </Fragment>
                              ))}
                            </Fragment>
                          );
                        }
                        return <li key={idx}>{item}</li>;
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="weather-summary" id="ride-details" style={{ scrollMarginTop: '20px' }}>
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
            {quickViewData.weather.hourly && quickViewData.weather.hourly.length > 0 && (
              <div id="weather-chart" style={{ marginTop: '8px', scrollMarginTop: '20px' }}>
                <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>Weather Evolution</h4>
                <WeatherChart weather={quickViewData.weather} config={quickViewData.config} />
              </div>
            )}
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

