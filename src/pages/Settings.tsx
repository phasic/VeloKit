import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
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
  const [currentLanguage, setCurrentLanguage] = useState(() => i18n.language);

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

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    storage.setLanguage(lang);
  };

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
    
    storage.setUnits(units);
    storage.setTheme(theme);
    storage.setDateFormat(dateFormat);
    storage.setDefaultDuration(defaultDuration);
    applyTheme(theme);
    
    setSavedMessage(t('settings.saved'));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onBack();
    }, 500);
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
    setSavedMessage(t('settings.cacheCleared'));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page settings" style={{ paddingBottom: '100px' }}>
      <div className="settings-header">
        <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="VeloKit" className="settings-app-icon" />
        <h2>VeloKit</h2>
      </div>
      <h3>{t('settings.title')}</h3>

      <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="language">{t('settings.language')}</label>
              <select
                id="language"
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="en">English</option>
                <option value="nl">Nederlands</option>
                <option value="fr">Français</option>
              </select>
              <small>{t('settings.languageDesc')}</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="defaultDuration">{t('settings.defaultDuration')}</label>
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
                <small>{t('settings.defaultDurationDesc')}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="units">{t('settings.units')}</label>
              <select
                id="units"
                value={units}
                onChange={(e) => setUnits(e.target.value as 'metric' | 'imperial')}
              >
                <option value="metric">{t('settings.metric')}</option>
                <option value="imperial">{t('settings.imperial')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dateFormat">{t('settings.dateFormat')}</label>
              <select
                id="dateFormat"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as 'custom' | 'system')}
              >
                <option value="system">{t('settings.dateFormatSystem')}</option>
                <option value="custom">{t('settings.dateFormatCustom')}</option>
              </select>
              <small>{t('settings.dateFormatDesc')}</small>
            </div>

            <div className="form-group">
              <label htmlFor="theme">{t('settings.theme')}</label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
              >
                <option value="system">{t('settings.themeSystem')}</option>
                <option value="light">{t('settings.themeLight')}</option>
                <option value="dark">{t('settings.themeDark')}</option>
              </select>
              <small>{t('settings.themeDesc')}</small>
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
                  {t('settings.installApp')}
                </button>
                <small style={{ display: 'block', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  {t('settings.installAppDesc')}
                </small>
              </div>
            )}

            {!isInstalled && (
              <div className="form-group">
                <div className="toggle-container">
                  <label htmlFor="disableInstallPrompt" className="toggle-label">{t('settings.disableInstallPrompt')}</label>
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
                <small>{t('settings.disableInstallPromptDesc')}</small>
              </div>
            )}


        <div className="settings-about-section">
          <div className="form-group">
            <div className="toggle-container">
              <label htmlFor="demoMode" className="toggle-label">{t('settings.demoMode')}</label>
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
            <small>{t('settings.demoModeDesc')}</small>
            {demoMode && (
              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    // Clear cache to force new random weather on next load
                    storage.clearWeatherCache();
                    setSavedMessage(t('settings.randomizeWeatherDesc'));
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                  }}
                >
                  {t('settings.randomizeWeather')}
                </button>
              </div>
            )}
          </div>
          <div className="settings-group-item" onClick={() => setShowClearCacheConfirm(true)}>
            <span>{t('settings.clearCache')}</span>
            <span className="arrow">›</span>
          </div>
          <button
            type="button"
            className="settings-about-btn"
            onClick={onAbout}
          >
            <span>{t('common.about')}</span>
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
          {t('common.back')}
        </button>
        <button type="button" className="btn btn-primary" onClick={(e) => { e.preventDefault(); handleSave(e); }}>
          {t('common.save')}
        </button>
      </div>

      {showClearCacheConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearCacheConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('settings.clearCache')}?</h3>
            <p>{t('settings.clearCacheConfirm')}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowClearCacheConfirm(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClearCache}
              >
                {t('settings.clearCache')}
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

