import { ClothingRecommendation, WeatherSummary, RideConfig, Location } from '../types';
import { storage } from '../utils/storage';
import { formatDateTime } from '../utils/dateFormat';

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
              <div className="badge-value">
                {Math.round(weather.minFeelsLike)}
                <span className="badge-unit">{tempUnit}</span>
              </div>
            </div>
            <div className="quick-weather-badge">
              <div className="badge-label">
                <img 
                  src={`${import.meta.env.BASE_URL}temperature.png`} 
                  alt="Temperature" 
                  className="badge-icon"
                />
              </div>
              <div className="badge-value">
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
            <div className="quick-weather-badge">
              <div className="badge-label">
                <img 
                  src={`${import.meta.env.BASE_URL}windy.png`} 
                  alt="Wind" 
                  className="badge-icon"
                />
              </div>
              <div className="badge-value">
                {Math.round(weather.maxWindSpeed)}<span className="badge-unit"> {windUnit}</span>
              </div>
            </div>
            <div className="quick-weather-badge">
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
              <ul>
                {recommendation.head.map((item, idx) => (
                  <li key={idx}>
                    <span className="item-emoji">{getItemEmoji(item, weather, config)}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.neckFace.length > 0 && (
            <div className="quick-kit">
              <h3>Neck / Face</h3>
              <ul>
                {recommendation.neckFace.map((item, idx) => (
                  <li key={idx}>
                    <span className="item-emoji">{getItemEmoji(item, weather, config)}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.chest.length > 0 && (
            <div className="quick-kit">
              <h3>Chest</h3>
              <ul>
                {recommendation.chest.map((item, idx) => (
                  <li key={idx}>
                    <span className="item-emoji">{getItemEmoji(item, weather, config)}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.legs.length > 0 && (
            <div className="quick-kit">
              <h3>Legs</h3>
              <ul>
                {recommendation.legs.map((item, idx) => (
                  <li key={idx}>
                    <span className="item-emoji">{getItemEmoji(item, weather, config)}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.hands.length > 0 && (
            <div className="quick-kit">
              <h3>Hands</h3>
              <ul>
                {recommendation.hands.map((item, idx) => (
                  <li key={idx}>
                    <span className="item-emoji">{getItemEmoji(item, weather, config)}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.feet.length > 0 && (
            <div className="quick-kit">
              <h3>Feet</h3>
              <ul>
                {recommendation.feet.map((item, idx) => (
                  <li key={idx}>
                    <span className="item-emoji">{getItemEmoji(item, weather, config)}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="weather-summary">
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

