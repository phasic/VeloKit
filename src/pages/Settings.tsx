import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';
import { isAppInstalled } from '../components/InstallPrompt';
import { DevTools } from '../components/DevTools';

interface SettingsProps {
  onBack: () => void;
  onAbout: () => void;
  onShowInstallPrompt?: (show: boolean) => void;
  onWeatherOverride?: (override: Partial<import('../types').WeatherSummary> | null) => void;
}

export function Settings({ onBack, onAbout, onShowInstallPrompt, onWeatherOverride }: SettingsProps) {
  const [apiKey, setApiKey] = useState(() => storage.getApiKey() || '');
  const [units, setUnits] = useState<'metric' | 'imperial'>(() => storage.getUnits());
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => storage.getTheme());
  const [dateFormat, setDateFormat] = useState<'custom' | 'system'>(() => storage.getDateFormat());
  const [defaultDuration, setDefaultDuration] = useState(() => storage.getDefaultDuration());
  const [defaultDurationInput, setDefaultDurationInput] = useState<string>(() => storage.getDefaultDuration().toString());
  const [defaultDurationError, setDefaultDurationError] = useState<string>('');
  const [demoMode, setDemoMode] = useState(() => storage.getDemoMode());
  const [disableInstallPrompt, setDisableInstallPrompt] = useState(() => storage.getDisableInstallPrompt());
  const [isInstalled, setIsInstalled] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string>('');
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [isApiKeyLocked, setIsApiKeyLocked] = useState(() => {
    const key = storage.getApiKey();
    return !!key && key.length > 0;
  });
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);

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
    // Validate default duration
    const numValue = parseFloat(defaultDurationInput);
    if (defaultDurationInput === '' || isNaN(numValue)) {
      setDefaultDurationError('Duration must be greater than 0');
    } else if (numValue === 0) {
      setDefaultDurationError('Duration must be greater than 0');
    } else if (numValue > 24) {
      setDefaultDurationError('Duration cannot exceed 24 hours');
    } else {
      setDefaultDurationError('');
      setDefaultDuration(numValue);
      storage.setDefaultDuration(numValue);
    }
  }, [defaultDurationInput]);

  useEffect(() => {
    storage.setDemoMode(demoMode);
  }, [demoMode]);

  useEffect(() => {
    storage.setDisableInstallPrompt(disableInstallPrompt);
  }, [disableInstallPrompt]);

  useEffect(() => {
    setIsInstalled(isAppInstalled());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate default duration before saving
    const numValue = parseFloat(defaultDurationInput);
    if (defaultDurationInput === '' || isNaN(numValue) || numValue === 0 || numValue > 24) {
      setDefaultDurationError(numValue === 0 || defaultDurationInput === '' || isNaN(numValue)
        ? 'Duration must be greater than 0' 
        : 'Duration cannot exceed 24 hours');
      return;
    }
    
    storage.setApiKey(apiKey);
    storage.setUnits(units);
    storage.setTheme(theme);
    storage.setDateFormat(dateFormat);
    storage.setDefaultDuration(defaultDuration);
    applyTheme(theme);
    
    // Lock API key if it's valid and not empty
    if (apiKey && apiKey.length > 0) {
      setIsApiKeyLocked(true);
    }
    
    setSavedMessage('Settings saved!');
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onBack();
    }, 500);
  };

  const handleUnlockApiKey = () => {
    setIsApiKeyLocked(false);
    setShowUnlockConfirm(false);
  };

  const handleLockApiKey = () => {
    if (apiKey && apiKey.length > 0) {
      setIsApiKeyLocked(true);
    }
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
    <div className="page settings" style={{ paddingBottom: '100px' }}>
      <div className="settings-header">
        <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="Dress My Ride" className="settings-app-icon" />
        <h2>Dress My Ride</h2>
      </div>
      <h3>Settings</h3>

      <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="defaultDuration">Default Riding Duration (hours)</label>
              <input
                id="defaultDuration"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={defaultDurationInput}
                onChange={(e) => {
                  setDefaultDurationInput(e.target.value);
                }}
              />
              {defaultDurationError && (
                <small style={{ color: 'var(--error-color)', display: 'block', marginTop: '4px' }}>
                  {defaultDurationError}
                </small>
              )}
              {!defaultDurationError && (
                <small>Default duration for quick view rides (0.5 to 24 hours)</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="units">Units</label>
              <select
                id="units"
                value={units}
                onChange={(e) => setUnits(e.target.value as 'metric' | 'imperial')}
              >
                <option value="metric">Metric (°C / km/h)</option>
                <option value="imperial">Imperial (°F / mph)</option>
              </select>
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

            {!isInstalled && (
              <div className="form-group">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (onShowInstallPrompt) {
                      onShowInstallPrompt(true);
                    }
                  }}
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  Install App
                </button>
                <small style={{ display: 'block', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  The app will be installed as a Progressive Web App (PWA) on your device
                </small>
              </div>
            )}

            {!isInstalled && (
              <div className="form-group">
                <div className="toggle-container">
                  <label htmlFor="disableInstallPrompt" className="toggle-label">Disable Weekly Reminder Install Prompt</label>
                  <label className="toggle-switch">
                    <input
                      id="disableInstallPrompt"
                      type="checkbox"
                      checked={disableInstallPrompt}
                      onChange={(e) => setDisableInstallPrompt(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <small>Never show the weekly reminder install prompt to add this app to your home screen</small>
              </div>
            )}


        <div className="settings-about-section">
          <div className="form-group">
            <div className="toggle-container">
              <label htmlFor="demoMode" className="toggle-label">Demo Mode</label>
              <label className="toggle-switch">
                <input
                  id="demoMode"
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <small>Use random weather conditions to try the app without an API key</small>
            {demoMode && (
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    // Clear cache to force new random weather on next load
                    storage.clearWeatherCache();
                    setSavedMessage('Weather will be randomized on next load!');
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                  }}
                >
                  Randomize Weather
                </button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="apiKey">OpenWeather API Key</label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              required={!isApiKeyLocked}
              disabled={isApiKeyLocked}
              style={{ opacity: isApiKeyLocked ? 0.6 : 1 }}
            />
            {isApiKeyLocked && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowUnlockConfirm(true)}
                style={{ marginTop: '8px', width: '100%' }}
              >
                Unlock API Key
              </button>
            )}
            {!isApiKeyLocked && (
              <>
                {apiKey && apiKey.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleLockApiKey}
                    style={{ marginTop: '8px', width: '100%' }}
                  >
                    Lock API Key
                  </button>
                )}
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
              </>
            )}
          </div>
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

      </form>

      <div className="settings-sticky-actions">
        {saved && (
          <div className="settings-saved-message">
            {savedMessage}
          </div>
        )}
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button type="button" className="btn btn-primary" onClick={(e) => { e.preventDefault(); handleSave(e); }}>
          Save
        </button>
      </div>

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

      {showUnlockConfirm && (
        <div className="modal-overlay" onClick={() => setShowUnlockConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Unlock API Key?</h3>
            <p>Are you sure you want to unlock the API key? You will be able to edit or delete it.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowUnlockConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUnlockApiKey}
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {onWeatherOverride && (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--separator-color)' }}>
          <DevTools onWeatherOverride={onWeatherOverride} />
        </div>
      )}
    </div>
  );
}

