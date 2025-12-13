import { useState, useEffect } from 'react';
import { RideConfig, Location } from '../types';
import { storage } from '../utils/storage';
import { geocodeCity } from '../services/weatherService';

interface RideSetupProps {
  onContinue: (location: Location, config: RideConfig) => void;
}

export function RideSetup({ onContinue }: RideSetupProps) {
  const [locationType, setLocationType] = useState<'current' | 'city'>('current');
  const [city, setCity] = useState('');
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    return now.toISOString().slice(0, 16);
  });
  const [durationHours, setDurationHours] = useState(2);
  const [units, setUnits] = useState<'metric' | 'imperial'>(() => storage.getUnits());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    storage.setUnits(units);
  }, [units]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let location: Location;

      if (locationType === 'current') {
        // Get current location
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by your browser');
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
      } else {
        // Geocode city
        if (!city.trim()) {
          throw new Error('Please enter a city name');
        }
        location = await geocodeCity(city);
      }

      const start = new Date(startTime);
      const config: RideConfig = {
        startTime: start,
        durationHours,
        units,
      };

      onContinue(location, config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
      setLoading(false);
    }
  };

  return (
    <div className="page setup">
      <h2>Ride Setup</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Location</label>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="locationType"
                value="current"
                checked={locationType === 'current'}
                onChange={(e) => setLocationType(e.target.value as 'current' | 'city')}
              />
              <span>Use current location</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="locationType"
                value="city"
                checked={locationType === 'city'}
                onChange={(e) => setLocationType(e.target.value as 'current' | 'city')}
              />
              <span>Enter city</span>
            </label>
          </div>
          {locationType === 'city' && (
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., London, New York"
              required={locationType === 'city'}
              style={{ marginTop: '8px' }}
            />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="startTime">Start time</label>
          <input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="duration">Duration (hours)</label>
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

        <div className="form-group">
          <label htmlFor="units">Units</label>
          <select
            id="units"
            value={units}
            onChange={(e) => setUnits(e.target.value as 'metric' | 'imperial')}
          >
            <option value="metric">°C / km/h</option>
            <option value="imperial">°F / mph</option>
          </select>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Get Recommendation'}
          </button>
        </div>
      </form>
    </div>
  );
}

