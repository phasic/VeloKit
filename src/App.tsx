import { useState, useEffect } from 'react';
import { Page, Location, RideConfig, WeatherSummary, ClothingRecommendation } from './types';
import { Home } from './pages/Home';
import { RideSetup } from './pages/RideSetup';
import { Recommendation } from './pages/Recommendation';
import { Settings } from './pages/Settings';
import { ClothingGuide } from './pages/ClothingGuide';
import { About } from './pages/About';
import { Welcome } from './pages/Welcome';
import { WardrobeManagement } from './pages/WardrobeManagement';
import { InstallPrompt } from './components/InstallPrompt';
import { fetchWeatherForecast } from './services/weatherService';
import { recommendClothing } from './logic/clothingEngine';
import { storage } from './utils/storage';
import { generateDemoWeather } from './utils/demoWeather';
import './App.css';

function App() {
  const [page, setPage] = useState<Page>(() => {
    // Check if user has seen welcome screen
    if (!storage.getWelcomeSeen()) {
      return 'welcome';
    }
    return 'home';
  });
  const [previousPage, setPreviousPage] = useState<Page | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [config, setConfig] = useState<RideConfig | null>(null);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [recommendation, setRecommendation] = useState<ClothingRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherOverride, setWeatherOverride] = useState<Partial<WeatherSummary> | null>(null);
  const [forceShowInstallPrompt, setForceShowInstallPrompt] = useState(false);
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string | null>(() => storage.getSelectedWardrobeId());
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showNavigateAwayConfirm, setShowNavigateAwayConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<Page | null>(null);
  
  // Check if default wardrobe is selected
  // Only treat as default if selectedWardrobeId is null, 'default', or empty string
  // Custom wardrobes will have a non-null, non-empty, non-'default' ID
  const isDefaultWardrobe = !selectedWardrobeId || selectedWardrobeId === 'default' || selectedWardrobeId === '';

  // Initialize theme on app load
  useEffect(() => {
    const theme = storage.getTheme();
    const root = document.documentElement;
    
    if (theme === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.remove('light');
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
        root.classList.remove('light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Use manual selection
      root.classList.remove('dark', 'light');
      root.classList.add(theme);
    }
  }, []);

  // Listen for wardrobe changes to update edit button visibility
  useEffect(() => {
    const handleStorageChange = () => {
      setSelectedWardrobeId(storage.getSelectedWardrobeId());
    };

    // Check on page change to guide
    if (page === 'guide') {
      setSelectedWardrobeId(storage.getSelectedWardrobeId());
    }

    // Listen for custom events that might change wardrobe
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wardrobeChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wardrobeChanged', handleStorageChange);
    };
  }, [page]);

  // Listen for edit mode changes from ClothingGuide
  useEffect(() => {
    const handleEditModeChange = (e: CustomEvent<boolean>) => {
      setIsEditMode(e.detail);
      if (!e.detail) {
        // Edit mode turned off, close any open confirmations
        setShowDiscardConfirm(false);
        setShowSaveConfirm(false);
      }
    };

    window.addEventListener('wardrobeEditModeChanged', handleEditModeChange as EventListener);
    return () => window.removeEventListener('wardrobeEditModeChanged', handleEditModeChange as EventListener);
  }, []);

  // Handle save all changes
  const handleSaveAllChanges = () => {
    // Dispatch event to ClothingGuide to save and exit edit mode
    window.dispatchEvent(new CustomEvent('saveWardrobeChanges'));
    setShowSaveConfirm(false);
  };

  // Handle discard all changes
  const handleDiscardAllChanges = () => {
    // Dispatch event to ClothingGuide to discard and exit edit mode
    window.dispatchEvent(new CustomEvent('discardWardrobeChanges'));
    setShowDiscardConfirm(false);
  };

  // Handle navigation with edit mode check
  const handleNavigate = (targetPage: Page) => {
    // If in edit mode and navigating away from guide page, show confirmation
    if (isEditMode && page === 'guide' && targetPage !== 'guide') {
      setPendingNavigation(targetPage);
      setShowNavigateAwayConfirm(true);
      return;
    }
    // Otherwise, navigate normally
    setPage(targetPage);
  };

  // Confirm navigation away (discard changes and navigate)
  const handleConfirmNavigateAway = () => {
    // Discard changes first
    window.dispatchEvent(new CustomEvent('discardWardrobeChanges'));
    // Then navigate
    if (pendingNavigation) {
      setPage(pendingNavigation);
      setPendingNavigation(null);
    }
    setShowNavigateAwayConfirm(false);
  };

  // Cancel navigation away (stay on current page)
  const handleCancelNavigateAway = () => {
    setPendingNavigation(null);
    setShowNavigateAwayConfirm(false);
  };

  const handleRideConfig = async (loc: Location, rideConfig: RideConfig) => {
    setLoading(true);
    setError(null);
    setLocation(loc);
    setConfig(rideConfig);

    try {
      let weatherData: WeatherSummary;
      
      // Use demo mode if enabled
      if (storage.getDemoMode()) {
        weatherData = generateDemoWeather(rideConfig.durationHours);
      } else {
        weatherData = await fetchWeatherForecast(loc, rideConfig);
      }
      
      // Apply weather override if in dev mode
      if (weatherOverride) {
        weatherData = { ...weatherData, ...weatherOverride };
      }
      
      const clothingRec = recommendClothing(weatherData, rideConfig);

      setWeather(weatherData);
      setRecommendation(clothingRec);
      handleNavigate('recommendation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleNewRecommendation = () => {
    handleNavigate('setup');
    setLocation(null);
    setConfig(null);
    setWeather(null);
    setRecommendation(null);
    setError(null);
  };

  const hasHeader = page !== 'welcome' && page !== 'settings' && page !== 'about';
  const hasNav = page === 'home' || page === 'setup' || page === 'recommendation' || page === 'guide';

  return (
    <div className={`app${hasHeader ? ' app--has-header' : ''}`}>
      {hasHeader && (
        <header className="app-header">
          <div className="app-header-inner">
            <div className="app-header-title">
              <img src={`${import.meta.env.BASE_URL}favicon.png`} alt="" className="app-header-icon" />
              <span className="app-header-wordmark">VeloKit</span>
            </div>
            {hasNav && (
              <nav className="app-header-nav">
                <button
                  className={`app-header-nav-btn${page === 'home' ? ' active' : ''}`}
                  onClick={() => handleNavigate('home')}
                  aria-label="Quick View"
                >
                  <img src={`${import.meta.env.BASE_URL}flash.png`} alt="" className="app-header-nav-icon" />
                </button>
                <button
                  className={`app-header-nav-btn${(page === 'setup' || page === 'recommendation') ? ' active' : ''}`}
                  onClick={() => {
                    if (recommendation && weather && config && location) {
                      handleNavigate('recommendation');
                    } else {
                      handleNavigate('setup');
                    }
                  }}
                  disabled={loading && page === 'setup'}
                  aria-label="Custom"
                >
                  <img src={`${import.meta.env.BASE_URL}equalizer.png`} alt="" className="app-header-nav-icon" />
                </button>
                <button
                  className={`app-header-nav-btn${page === 'guide' ? ' active' : ''}`}
                  onClick={() => handleNavigate('guide')}
                  aria-label="Wardrobe"
                >
                  <img src={`${import.meta.env.BASE_URL}wardrobe.png`} alt="" className="app-header-nav-icon" />
                </button>
              </nav>
            )}
            <div className="app-header-actions">
              {page === 'guide' && !isDefaultWardrobe && (
                <>
                  <button
                    className="app-header-btn"
                    onClick={() => window.dispatchEvent(new CustomEvent('openAddClothing'))}
                    aria-label="Add Clothing"
                  >
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4.167V15.833M4.167 10H15.833" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {!isEditMode ? (
                    <button
                      className="app-header-btn"
                      onClick={() => window.dispatchEvent(new CustomEvent('toggleWardrobeEdit'))}
                      aria-label="Edit Wardrobe"
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M11.05 3L4.208 10.242c-.258.275-.508.817-.558 1.192L3.342 14.133c-.108.975.592 1.642 1.558 1.475l2.683-.458c.375-.067.9-.342 1.158-.625L15.583 7.283C16.767 6.033 17.3 4.608 15.458 2.867 13.625 1.142 12.233 1.75 11.05 3Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9.908 4.208c.358 2.3 2.225 4.058 4.542 4.292" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  ) : (
                    <>
                      <button
                        className="app-header-btn app-header-btn--danger"
                        onClick={() => setShowDiscardConfirm(true)}
                        aria-label="Discard changes"
                      >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                          <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className="app-header-btn app-header-btn--success"
                        onClick={() => setShowSaveConfirm(true)}
                        aria-label="Save changes"
                      >
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                          <path d="M16.667 5L7.5 14.167L3.333 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                className="app-header-btn"
                onClick={() => { setPreviousPage(page); handleNavigate('settings'); }}
                aria-label="Settings"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>
        </header>
      )}

      <main>
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading weather data...</p>
          </div>
        )}

        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {!loading && page === 'welcome' && (
          <Welcome
            onGetStarted={() => {
              setPage('home');
            }}
            onTryDemo={() => setPage('home')}
          />
        )}

            {!loading && page === 'home' && (
              <Home
                onLocationFound={() => setPage('setup')}
                onManualInput={() => setPage('setup')}
                onQuickRecommendation={(loc, weather, rec, cfg) => {
                  setLocation(loc);
                  setWeather(weather);
                  setRecommendation(rec);
                  setConfig(cfg);
                }}
                onNavigateToWardrobe={() => handleNavigate('guide')}
                onNavigateToCustom={() => handleNavigate('setup')}
                weatherOverride={weatherOverride}
              />
            )}

        {!loading && page === 'setup' && (
          <RideSetup
            onContinue={handleRideConfig}
          />
        )}

        {!loading && page === 'recommendation' && weather && recommendation && config && location && (
          <Recommendation
            recommendation={recommendation}
            weather={weather}
            config={config}
            location={location}
            onBack={handleNewRecommendation}
          />
        )}

        {!loading && page === 'settings' && (
          <Settings 
            onBack={() => {
              // Return to previous page if available, otherwise go to home
              handleNavigate(previousPage || 'home');
              setPreviousPage(null);
            }} 
            onAbout={() => {
              // Don't change previousPage - keep it so Settings can return to original page
              setPage('about');
            }}
            onShowInstallPrompt={setForceShowInstallPrompt}
            onWeatherOverride={setWeatherOverride}
          />
        )}

        {!loading && page === 'about' && (
          <About onBack={() => {
            // Always go back to settings since About is only accessible from Settings
            // previousPage is preserved so Settings can return to the original page
            setPage('settings');
          }} />
        )}

        {!loading && page === 'wardrobes' && (
          <WardrobeManagement onBack={() => handleNavigate('guide')} />
        )}

            {!loading && page === 'guide' && (
              <ClothingGuide />
            )}
          </main>

          {page !== 'welcome' && (
            <InstallPrompt 
              forceShow={forceShowInstallPrompt}
              onForceShowChange={setForceShowInstallPrompt}
            />
          )}

      {/* Discard Changes Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="modal-overlay" onClick={() => setShowDiscardConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Discard All Changes?</h3>
            <p>Are you sure you want to discard all changes? This will reload the wardrobe and undo any edits you've made.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDiscardConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDiscardAllChanges}
                style={{ backgroundColor: '#FF3B30' }}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Changes Confirmation Modal */}
      {showSaveConfirm && (
        <div className="modal-overlay" onClick={() => setShowSaveConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Save All Changes?</h3>
            <p>Are you sure you want to save all changes and exit edit mode?</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSaveConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveAllChanges}
                style={{ backgroundColor: '#34C759' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigate Away Confirmation Modal */}
      {showNavigateAwayConfirm && (
        <div className="modal-overlay" onClick={handleCancelNavigateAway}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Discard Changes?</h3>
            <p>You have unsaved changes in edit mode. Navigating away will discard all changes you've made. Are you sure you want to continue?</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelNavigateAway}
              >
                Stay on Page
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmNavigateAway}
                style={{ backgroundColor: '#FF3B30' }}
              >
                Discard & Navigate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

