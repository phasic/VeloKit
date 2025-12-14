import { Fragment } from 'react';
import { ClothingRecommendation, WeatherSummary, RideConfig, Location } from '../types';
import { storage } from '../utils/storage';
import { formatDateTime } from '../utils/dateFormat';
import { WeatherChart } from '../components/WeatherChart';

interface RecommendationProps {
  recommendation: ClothingRecommendation;
  weather: WeatherSummary;
  config: RideConfig;
  location: Location;
  onBack: () => void;
}

export function Recommendation({
  recommendation,
  weather,
  config,
  location,
  onBack,
}: RecommendationProps) {
  const isMetric = config.units === 'metric';
  const tempUnit = isMetric ? '°C' : '°F';
  const windUnit = isMetric ? 'km/h' : 'mph';

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
    <div className="page recommendation">
      <div className="quick-view">
        <div className="quick-view-header">
          <div className="quick-weather-badges">
            <div className="quick-weather-badge">
              <div className="badge-label">
                <img 
                  src={`${import.meta.env.BASE_URL}palm.png`} 
                  alt="Feels like" 
                  className="badge-icon"
                />
              </div>
              <div className="badge-value" style={{ fontSize: getTemperatureFontSize(weather.minFeelsLike, weather.maxFeelsLike) }}>
                {Math.round(weather.minFeelsLike) === Math.round(weather.maxFeelsLike) ? (
                  <>
                    {Math.round(weather.minFeelsLike)}<span className="badge-unit">{tempUnit}</span>
                  </>
                ) : (
                  <>
                    {Math.round(weather.minFeelsLike)}<span className="badge-unit">{tempUnit}</span> <span className="badge-dash">-</span> {Math.round(weather.maxFeelsLike)}<span className="badge-unit">{tempUnit}</span>
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
              <div className="badge-value" style={{ fontSize: getTemperatureFontSize(weather.minTemp, weather.maxTemp) }}>
                {Math.round(weather.minTemp) === Math.round(weather.maxTemp) ? (
                  <>
                    {Math.round(weather.minTemp)}<span className="badge-unit">{tempUnit}</span>
                  </>
                ) : (
                  <>
                    {Math.round(weather.minTemp)}<span className="badge-unit">{tempUnit}</span> <span className="badge-dash">-</span> {Math.round(weather.maxTemp)}<span className="badge-unit">{tempUnit}</span>
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
                {Math.round(weather.maxWindSpeed)}<span className="badge-unit"> {windUnit}</span>
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
              <div className="badge-value">{Math.round(weather.maxRainProbability * 100)}%</div>
            </div>
          </div>
        </div>

        <div className="quick-clothing">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>What to wear</h3>
            <button
              className="refresh-btn"
              onClick={onBack}
              aria-label="New recommendation"
              style={{ margin: 0 }}
            >
              <span>New recommendation</span>
            </button>
          </div>
          {recommendation.head.length > 0 && (
            <div className="quick-kit">
              <h3>Head</h3>
              {groupItemsByType(recommendation.head, weather, config).map((group, groupIdx) => (
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

          {recommendation.neckFace.length > 0 && (
            <div className="quick-kit">
              <h3>Neck / Face</h3>
              {groupItemsByType(recommendation.neckFace, weather, config).map((group, groupIdx) => (
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

          {recommendation.chest.length > 0 && (
            <div className="quick-kit">
              <h3>Chest</h3>
              {groupItemsByType(recommendation.chest, weather, config).map((group, groupIdx) => (
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

          {recommendation.legs.length > 0 && (
            <div className="quick-kit">
              <h3>Legs</h3>
              {groupItemsByType(recommendation.legs, weather, config).map((group, groupIdx) => (
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

          {recommendation.hands.length > 0 && (
            <div className="quick-kit">
              <h3>Hands</h3>
              {groupItemsByType(recommendation.hands, weather, config).map((group, groupIdx) => (
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

          {recommendation.feet.length > 0 && (
            <div className="quick-kit">
              <h3>Feet</h3>
              {groupItemsByType(recommendation.feet, weather, config).map((group, groupIdx) => (
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

        <div className="weather-summary" id="ride-details">
          <h3>Ride details</h3>
          <div className="weather-grid">
            <div className="weather-item">
              <span className="label">Date/Time:</span>
              <span className="value">
                {formatDateTime(new Date(config.startTime), storage.getDateFormat())}
              </span>
            </div>
            <div className="weather-item">
              <span className="label">Duration:</span>
              <span className="value">
                {config.durationHours} {config.durationHours === 1 ? 'hour' : 'hours'}
              </span>
            </div>
            <div className="weather-item location-item">
              <span className="label">Location:</span>
              <span className="value">
                {location.city || `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`}
              </span>
            </div>
          </div>
          {weather.hourly && weather.hourly.length > 0 && (
            <div id="weather-chart" style={{ marginTop: '8px', scrollMarginTop: '20px' }}>
              <h4 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>Weather Evolution</h4>
              <WeatherChart weather={weather} config={config} />
            </div>
          )}
        </div>

        <div className="explanation-section">
          <h3>Why?</h3>
          <ul>
            {recommendation.explanation.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

