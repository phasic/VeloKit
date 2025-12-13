import { useState, useEffect } from 'react';
import { Page, Location, RideConfig, WeatherSummary, ClothingRecommendation } from './types';
import { Home } from './pages/Home';
import { RideSetup } from './pages/RideSetup';
import { Recommendation } from './pages/Recommendation';
import { Settings } from './pages/Settings';
import { ManualLocation } from './pages/ManualLocation';
import { ClothingGuide } from './pages/ClothingGuide';
import { DevTools } from './components/DevTools';
import { fetchWeatherForecast } from './services/weatherService';
import { recommendClothing } from './logic/clothingEngine';
import { storage } from './utils/storage';
import './App.css';

function App() {
  const [page, setPage] = useState<Page>('home');
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

  const handleLocationFound = (loc: Location) => {
    setLocation(loc);
    setPage('setup');
  };

      const handleRideConfig = async (rideConfig: RideConfig) => {
        if (!location) return;

        setLoading(true);
        setError(null);
        setConfig(rideConfig);

        try {
          let weatherData = await fetchWeatherForecast(location, rideConfig);
          
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
      <header>
        <div className="header-title">
          <img src={`${import.meta.env.BASE_URL}pwa-192x192.png`} alt="DressMyRide" className="header-icon" />
          <h1>DressMyRide</h1>
        </div>
        <div className="header-actions">
          <button
            className="btn-icon"
            onClick={() => setPage(page === 'guide' ? 'home' : 'guide')}
            aria-label="Clothing Guide"
            title="Clothing Guide"
          >
            📖
          </button>
          <button
            className="btn-icon"
            onClick={() => setPage(page === 'settings' ? 'home' : 'settings')}
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

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

            {!loading && page === 'home' && (
              <Home
                onLocationFound={handleLocationFound}
                onManualInput={() => setPage('manual')}
                onQuickRecommendation={(loc, weather, rec, cfg) => {
                  setLocation(loc);
                  setWeather(weather);
                  setRecommendation(rec);
                  setConfig(cfg);
                }}
                weatherOverride={weatherOverride}
              />
            )}

        {!loading && page === 'manual' && (
          <ManualLocation
            onLocationFound={handleLocationFound}
            onBack={() => setPage('home')}
          />
        )}

        {!loading && page === 'setup' && (
          <RideSetup
            onContinue={handleRideConfig}
            onBack={() => setPage('home')}
          />
        )}

        {!loading && page === 'recommendation' && weather && recommendation && config && (
          <Recommendation
            recommendation={recommendation}
            weather={weather}
            config={config}
            onBack={handleNewRecommendation}
          />
        )}

        {!loading && page === 'settings' && (
          <Settings onBack={() => setPage('home')} />
        )}

            {!loading && page === 'guide' && (
              <ClothingGuide onBack={() => setPage('home')} />
            )}
          </main>

          <DevTools onWeatherOverride={setWeatherOverride} />
        </div>
      );
    }

    export default App;

