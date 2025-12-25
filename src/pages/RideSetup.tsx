import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RideConfig, Location } from '../types';
import { storage } from '../utils/storage';
import { geocodeCity } from '../services/weatherService';
import { MapPicker } from '../components/MapPicker';

interface RideSetupProps {
  onContinue: (location: Location, config: RideConfig) => void;
}

export function RideSetup({ onContinue }: RideSetupProps) {
  const { t } = useTranslation();
  const [locationType, setLocationType] = useState<'current' | 'city' | 'favorites'>('current');
  const [cityInputType, setCityInputType] = useState<'search' | 'map'>('search');
  const [city, setCity] = useState('');
  const [mapLocation, setMapLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [favorites, setFavorites] = useState<Location[]>([]);
  const [searching, setSearching] = useState(false);
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    return now.toISOString().slice(0, 16);
  });
  const [durationHours, setDurationHours] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load favorites on mount
  useEffect(() => {
    setFavorites(storage.getFavoriteLocations());
  }, []);

  const toggleFavorite = (location: Location, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const isFavorite = storage.isFavoriteLocation(location);
    if (isFavorite) {
      storage.removeFavoriteLocation(location);
    } else {
      storage.addFavoriteLocation(location);
    }
    setFavorites(storage.getFavoriteLocations());
  };

  const handleFavoriteSelect = (location: Location) => {
    setSelectedLocation(location);
    setCity(location.city || '');
    setError(null);
    // Ensure locationType is set to favorites when selecting a favorite
    if (locationType !== 'favorites') {
      setLocationType('favorites');
    }
  };

  const handleSearch = async () => {
    if (!city.trim()) {
      setError(t('setup.pleaseEnterCity'));
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const location = await geocodeCity(city);
      setSelectedLocation(location);
      setCity(location.city || city); // Update city with the found city name
    } catch (err) {
      setError(err instanceof Error ? err.message : t('setup.failedToFindCity'));
      setSelectedLocation(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let location: Location;

      if (locationType === 'current') {
        // Get current location
        if (!navigator.geolocation) {
          throw new Error(t('setup.geolocationNotSupported'));
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        // Use precise coordinates (rounding happens in fetchWeatherForecast for cache key)
        location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
      } else if (locationType === 'favorites') {
        // Favorites selection
        if (!selectedLocation) {
          throw new Error(t('setup.selectLocation'));
        }
        location = selectedLocation;
      } else {
        // City input - either search or map
        if (cityInputType === 'map') {
          if (!mapLocation) {
            throw new Error(t('setup.pleaseSelectLocation'));
          }
          location = mapLocation;
        } else {
          // Search by name - must have selected location (from search)
          if (!selectedLocation) {
            throw new Error('Please search for a city');
          }
          location = selectedLocation;
        }
      }

      const start = new Date(startTime);
      const config: RideConfig = {
        startTime: start,
        durationHours,
        units: storage.getUnits(), // Use units from settings
      };

      onContinue(location, config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      setLoading(false);
    }
  };

  return (
    <div className="page setup">
      <h2>{t('setup.title')}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('setup.location')}</label>
          <div className="location-selector">
            <button
              type="button"
              className={`location-option ${locationType === 'current' ? 'active' : ''}`}
              onClick={() => {
                setLocationType('current');
                setSelectedLocation(null);
              }}
            >
              <div className="location-option-icon">📍</div>
              <div className="location-option-content">
                <div className="location-option-title">{t('setup.currentLocation')}</div>
                <div className="location-option-subtitle">{t('setup.currentLocationSubtitle')}</div>
              </div>
              <div className="location-option-check">
                {locationType === 'current' && '✓'}
              </div>
            </button>
            <button
              type="button"
              className={`location-option ${locationType === 'city' ? 'active' : ''}`}
              onClick={() => {
                setLocationType('city');
                setSelectedLocation(null);
              }}
            >
              <div className="location-option-icon">🏙️</div>
              <div className="location-option-content">
                <div className="location-option-title">{t('setup.enterCity')}</div>
                <div className="location-option-subtitle">{t('setup.enterCitySubtitle')}</div>
              </div>
              <div className="location-option-check">
                {locationType === 'city' && '✓'}
              </div>
            </button>
              {favorites.length > 0 && (
              <button
                type="button"
                className={`location-option ${locationType === 'favorites' ? 'active' : ''}`}
                onClick={() => {
                  setLocationType('favorites');
                  setSelectedLocation(null);
                }}
              >
                <div className="location-option-icon">⭐</div>
                <div className="location-option-content">
                  <div className="location-option-title">{t('setup.favorites')}</div>
                  <div className="location-option-subtitle">
                    {favorites.length === 1 
                      ? t('setup.favoritesSubtitle', { count: favorites.length })
                      : t('setup.favoritesSubtitlePlural', { count: favorites.length })}
                  </div>
                </div>
                <div className="location-option-check">
                  {locationType === 'favorites' && '✓'}
                </div>
              </button>
            )}
          </div>
          {locationType === 'favorites' && (
            <div className="favorites-section" style={{ marginTop: '12px' }}>
              <div className="favorites-grid">
                {favorites.map((fav, index) => {
                  const isSelected = selectedLocation && Math.abs(selectedLocation.lat - fav.lat) < 0.01 && Math.abs(selectedLocation.lon - fav.lon) < 0.01;
                  return (
                    <div
                      key={`${fav.lat}-${fav.lon}-${index}`}
                      className={`favorite-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleFavoriteSelect(fav)}
                    >
                      <span style={{ flex: 1 }}>{fav.city || `${fav.lat.toFixed(2)}, ${fav.lon.toFixed(2)}`}</span>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(fav, e)}
                        className="favorite-star"
                        aria-label={t('setup.removeFromFavorites')}
                      >
                        ⭐
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {locationType === 'city' && (
            <div className="city-input-options" style={{ marginTop: '12px' }}>
              <div className="city-input-tabs">
                <button
                  type="button"
                  className={`city-input-tab ${cityInputType === 'search' ? 'active' : ''}`}
                  onClick={() => {
                    setCityInputType('search');
                    setSelectedLocation(null);
                  }}
                >
                  {t('setup.searchByName')}
                </button>
                <button
                  type="button"
                  className={`city-input-tab ${cityInputType === 'map' ? 'active' : ''}`}
                  onClick={() => {
                    setCityInputType('map');
                    setSelectedLocation(null);
                  }}
                >
                  {t('setup.selectOnMap')}
                </button>
              </div>
              {cityInputType === 'search' ? (
                <div style={{ marginTop: '12px' }}>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setSelectedLocation(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder={t('setup.cityPlaceholder')}
                    style={{ width: '100%', marginBottom: '8px' }}
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="btn btn-secondary"
                    disabled={searching || !city.trim()}
                    style={{ width: '100%', marginBottom: '8px' }}
                  >
                    {searching ? t('setup.searching') : t('setup.search')}
                  </button>
                  {selectedLocation && (
                    <div className="search-result" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '12px', 
                      backgroundColor: 'var(--bg-color)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '10px',
                      marginTop: '8px'
                    }}>
                      <span>{selectedLocation.city || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lon.toFixed(4)}`}</span>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(selectedLocation, e)}
                        className="favorite-star"
                        style={{
                          color: storage.isFavoriteLocation(selectedLocation) ? '#FFD700' : 'var(--secondary-color)'
                        }}
                        aria-label={storage.isFavoriteLocation(selectedLocation) ? t('setup.removeFromFavorites') : t('setup.addToFavorites')}
                      >
                        {storage.isFavoriteLocation(selectedLocation) ? '⭐' : '☆'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: '12px' }}>
                  <MapPicker
                    onLocationSelect={(location) => {
                      setMapLocation(location);
                      setSelectedLocation(location);
                      setError(null);
                    }}
                  />
                  {mapLocation && (
                    <div className="map-location-display" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                      <span>{mapLocation.city || `${mapLocation.lat.toFixed(4)}, ${mapLocation.lon.toFixed(4)}`}</span>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(mapLocation, e)}
                        className="favorite-star"
                        style={{
                          color: storage.isFavoriteLocation(mapLocation) ? '#FFD700' : 'var(--secondary-color)'
                        }}
                        aria-label={storage.isFavoriteLocation(mapLocation) ? t('setup.removeFromFavorites') : t('setup.addToFavorites')}
                      >
                        {storage.isFavoriteLocation(mapLocation) ? '⭐' : '☆'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="startTime">{t('setup.startTime')}</label>
          <input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="duration">{t('setup.duration')}</label>
          <input
            id="duration"
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={durationHours}
            onChange={(e) => setDurationHours(parseFloat(e.target.value))}
            required
          />
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('common.loading') : t('setup.getRecommendation')}
          </button>
        </div>
      </form>
    </div>
  );
}

