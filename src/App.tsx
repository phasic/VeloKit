import { useState } from 'react';
import { Page, Location, RideConfig, WeatherSummary, ClothingRecommendation } from './types';
import { Home } from './pages/Home';
import { RideSetup } from './pages/RideSetup';
import { Recommendation } from './pages/Recommendation';
import { Settings } from './pages/Settings';
import { ManualLocation } from './pages/ManualLocation';
import { fetchWeatherForecast } from './services/weatherService';
import { recommendClothing } from './logic/clothingEngine';
import './App.css';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [location, setLocation] = useState<Location | null>(null);
  const [config, setConfig] = useState<RideConfig | null>(null);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [recommendation, setRecommendation] = useState<ClothingRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const weatherData = await fetchWeatherForecast(location, rideConfig);
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
        <h1>DressMyRide</h1>
        <button
          className="btn-icon"
          onClick={() => setPage(page === 'settings' ? 'home' : 'settings')}
          aria-label="Settings"
        >
          ⚙️
        </button>
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
      </main>
    </div>
  );
}

export default App;

