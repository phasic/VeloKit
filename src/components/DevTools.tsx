import { useState, useEffect } from 'react';
import { WeatherSummary } from '../types';
import { storage } from '../utils/storage';
import './DevTools.css';

interface DevToolsProps {
  onWeatherOverride: (override: Partial<WeatherSummary> | null) => void;
}

export function DevTools({ onWeatherOverride }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [overrides, setOverrides] = useState<Partial<WeatherSummary>>(() => {
    const saved = localStorage.getItem('dressmyride_dev_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    // Check if running on localhost
    const hostname = window.location.hostname;
    setIsLocalhost(hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '');
  }, []);

  useEffect(() => {
    // Save overrides to localStorage
    if (Object.keys(overrides).length > 0) {
      localStorage.setItem('dressmyride_dev_overrides', JSON.stringify(overrides));
    } else {
      localStorage.removeItem('dressmyride_dev_overrides');
    }
    
    // Notify parent component
    onWeatherOverride(Object.keys(overrides).length > 0 ? overrides : null);
  }, [overrides, onWeatherOverride]);

  const handleChange = (field: keyof WeatherSummary, value: number) => {
    setOverrides(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClear = () => {
    setOverrides({});
  };

  const handleReset = () => {
    setOverrides({
      minTemp: 10,
      maxTemp: 12,
      minFeelsLike: 10,
      maxWindSpeed: 10,
      maxRainProbability: 0,
      maxPrecipitationIntensity: 0,
    });
  };

  const handleResetWelcome = () => {
    storage.setWelcomeSeen(false);
    window.location.reload();
  };

  if (!isLocalhost) {
    return null;
  }

  return (
    <>
      <button
        className="btn-icon dev-tools-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Dev Tools"
        title="Dev Tools"
      >
        {isOpen ? '✕' : '🔧'}
      </button>

      {isOpen && (
        <div className="dev-tools-panel">
          <div className="dev-tools-header">
            <h3>Dev Tools - Weather Override</h3>
            <button
              className="dev-tools-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="dev-tools-content">
            <div className="dev-tools-group">
              <label>
                Min Temperature (°C)
                <input
                  type="number"
                  value={overrides.minTemp ?? ''}
                  onChange={(e) => handleChange('minTemp', parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 10"
                />
              </label>
            </div>

            <div className="dev-tools-group">
              <label>
                Max Temperature (°C)
                <input
                  type="number"
                  value={overrides.maxTemp ?? ''}
                  onChange={(e) => handleChange('maxTemp', parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 12"
                />
              </label>
            </div>

            <div className="dev-tools-group">
              <label>
                Min Feels Like (°C)
                <input
                  type="number"
                  value={overrides.minFeelsLike ?? ''}
                  onChange={(e) => handleChange('minFeelsLike', parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 10"
                />
              </label>
            </div>

            <div className="dev-tools-group">
              <label>
                Max Wind Speed (km/h)
                <input
                  type="number"
                  value={overrides.maxWindSpeed ?? ''}
                  onChange={(e) => handleChange('maxWindSpeed', parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 25"
                />
              </label>
            </div>

            <div className="dev-tools-group">
              <label>
                Rain Probability (0-1)
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={overrides.maxRainProbability ?? ''}
                  onChange={(e) => handleChange('maxRainProbability', parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 0.7"
                />
              </label>
            </div>

            <div className="dev-tools-group">
              <label>
                Precipitation Intensity (mm)
                <input
                  type="number"
                  step="0.1"
                  value={overrides.maxPrecipitationIntensity ?? ''}
                  onChange={(e) => handleChange('maxPrecipitationIntensity', parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 2.5"
                />
              </label>
            </div>

            <div className="dev-tools-actions">
              <button className="btn btn-secondary" onClick={handleReset}>
                Reset to Default
              </button>
              <button className="btn btn-secondary" onClick={handleClear}>
                Clear Override
              </button>
            </div>

            {Object.keys(overrides).length > 0 && (
              <div className="dev-tools-status">
                <strong>⚠️ Override Active</strong>
                <p>Weather data is being overridden. API responses will be modified.</p>
              </div>
            )}

            <div className="dev-tools-section-divider"></div>

            <div className="dev-tools-group">
              <h4>Testing Tools</h4>
              <button className="btn btn-secondary" onClick={handleResetWelcome}>
                Show Welcome Screen
              </button>
              <p className="dev-tools-hint">Resets the welcome screen flag and reloads the page</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

