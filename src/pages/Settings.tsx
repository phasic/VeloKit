import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

interface SettingsProps {
  onBack: () => void;
  onAbout: () => void;
}

export function Settings({ onBack, onAbout }: SettingsProps) {
  const [apiKey, setApiKey] = useState(() => storage.getApiKey() || '');
  const [units, setUnits] = useState<'metric' | 'imperial'>(() => storage.getUnits());
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => storage.getTheme());
  const [dateFormat, setDateFormat] = useState<'custom' | 'system'>(() => storage.getDateFormat());
  const [defaultDuration, setDefaultDuration] = useState(() => storage.getDefaultDuration());
  const [saved, setSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string>('');
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);

  useEffect(() => {
    storage.setUnits(units);
  }, [units]);

  useEffect(() => {
    storage.setTheme(theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    storage.setDateFormat(dateFormat);
  }, [dateFormat]);

  useEffect(() => {
    storage.setDefaultDuration(defaultDuration);
  }, [defaultDuration]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.setApiKey(apiKey);
    storage.setUnits(units);
    storage.setTheme(theme);
    storage.setDateFormat(dateFormat);
    storage.setDefaultDuration(defaultDuration);
    applyTheme(theme);
    setSavedMessage('Settings saved!');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (selectedTheme === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.remove('light');
    } else {
      // Use manual selection
      root.classList.remove('dark', 'light');
      root.classList.add(selectedTheme);
    }
  };

  const handleClearCache = () => {
    storage.clearWeatherCache();
    setShowClearCacheConfirm(false);
    setSavedMessage('Cache cleared!');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page settings">
      <h2>Settings</h2>

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="apiKey">OpenWeather API Key</label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            required
          />
          <small>
            Get your API key at{' '}
            <a
              href="https://openweathermap.org/api"
              target="_blank"
              rel="noopener noreferrer"
            >
              openweathermap.org
            </a>
            . <strong>Note:</strong> This app requires One Call API 3.0, which needs a subscription (free tier available). Subscribe at{' '}
            <a
              href="https://openweathermap.org/api/one-call-3"
              target="_blank"
              rel="noopener noreferrer"
            >
              openweathermap.org/api/one-call-3
            </a>
          </small>
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

            <div className="form-group">
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <small>Choose your preferred color theme</small>
            </div>

            <div className="form-group">
              <label htmlFor="dateFormat">Date/Time Format</label>
              <select
                id="dateFormat"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as 'custom' | 'system')}
              >
                <option value="system">System (e.g., Dec 15, 2:30 PM)</option>
                <option value="custom">Custom (e.g., Saturday 13 Dec, 20:13)</option>
              </select>
              <small>Choose your preferred date and time format</small>
            </div>

            <div className="form-group">
              <label htmlFor="defaultDuration">Default Riding Duration (hours)</label>
              <input
                id="defaultDuration"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(parseFloat(e.target.value) || 2)}
              />
              <small>Default duration for quick view rides (0.5 to 24 hours)</small>
            </div>

        {saved && <div className="success">{savedMessage}</div>}

        <div className="settings-about-section">
          <div className="settings-group-item" onClick={() => setShowClearCacheConfirm(true)}>
            <span>Clear Weather Cache</span>
            <span className="arrow">›</span>
          </div>
          <button
            type="button"
            className="settings-about-btn"
            onClick={onAbout}
          >
            <span>About</span>
            <span className="settings-about-arrow">›</span>
          </button>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Back
          </button>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>

      {showClearCacheConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearCacheConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Clear Weather Cache?</h3>
            <p>This will clear all cached weather data. The app will fetch fresh data on the next request.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowClearCacheConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClearCache}
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

