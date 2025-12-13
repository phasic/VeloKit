import { useState, useEffect } from 'react';
import { Page, Location, RideConfig, WeatherSummary, ClothingRecommendation } from './types';
import { Home } from './pages/Home';
import { RideSetup } from './pages/RideSetup';
import { Recommendation } from './pages/Recommendation';
import { Settings } from './pages/Settings';
import { ClothingGuide } from './pages/ClothingGuide';
import { About } from './pages/About';
import { Welcome } from './pages/Welcome';
import { DevTools } from './components/DevTools';
import { BottomTabBar } from './components/BottomTabBar';
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
  const [location, setLocation] = useState<Location | null>(null);
  const [config, setConfig] = useState<RideConfig | null>(null);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [recommendation, setRecommendation] = useState<ClothingRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherOverride, setWeatherOverride] = useState<Partial<WeatherSummary> | null>(null);

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

  const handleRideConfig = async (loc: Location, rideConfig: RideConfig) => {
    setLoading(true);
    setError(null);
    setLocation(loc);
    setConfig(rideConfig);

    try {
      let weatherData: WeatherSummary;
      
      // Use demo mode if enabled
      if (storage.getDemoMode()) {
        weatherData = generateDemoWeather();
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
      setPage('recommendation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleNewRecommendation = () => {
    setPage('home');
    setLocation(null);
    setConfig(null);
    setWeather(null);
    setRecommendation(null);
    setError(null);
  };

  return (
    <div className="app">
      {page !== 'welcome' && (
      <header>
        <div className="header-title">
          <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="Dress My Ride" className="header-icon" />
          <h1>Dress My Ride</h1>
        </div>
        <div className="header-actions">
          <DevTools onWeatherOverride={setWeatherOverride} />
          <button
            className="btn-icon"
            onClick={() => setPage(page === 'settings' ? 'home' : 'settings')}
            aria-label="Settings"
          >
            <img
              src={`${import.meta.env.BASE_URL}settings.png`}
              alt="Settings"
              className="settings-icon"
            />
          </button>
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
            onGetStarted={() => setPage('settings')}
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
            onBack={() => setPage('home')} 
            onAbout={() => setPage('about')}
          />
        )}

        {!loading && page === 'about' && (
          <About onBack={() => setPage('settings')} />
        )}

            {!loading && page === 'guide' && (
              <ClothingGuide />
            )}
          </main>

          {(page === 'home' || page === 'setup' || page === 'guide' || page === 'recommendation') && (
            <BottomTabBar
              currentPage={page}
              onHome={() => setPage('home')}
              onCustom={() => setPage('setup')}
              onGuide={() => setPage('guide')}
              customLoading={loading && page === 'setup'}
            />
          )}

          {page !== 'welcome' && <InstallPrompt />}
        </div>
      );
    }

    export default App;

