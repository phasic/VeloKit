import { storage } from '../utils/storage';
import './Welcome.css';

interface WelcomeProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

export function Welcome({ onGetStarted, onTryDemo }: WelcomeProps) {
  const handleGetStarted = () => {
    // Mark welcome as seen
    storage.setWelcomeSeen(true);
    onGetStarted();
  };

  const handleTryDemo = () => {
    // Enable demo mode and mark welcome as seen
    storage.setDemoMode(true);
    storage.setWelcomeSeen(true);
    onTryDemo();
  };

  return (
    <div className="page welcome">
      <div className="welcome-content">
        <div className="welcome-icon">
          <img 
            src={`${import.meta.env.BASE_URL}pwa-192x192.png`} 
            alt="Dress My Ride"
            className="welcome-app-icon"
          />
        </div>
        
        <h1>Welcome to Dress My Ride</h1>
        
        <p className="welcome-description">
          Get personalized cycling clothing recommendations based on real-time weather conditions at your location.
        </p>

        <div className="welcome-info">
          <div className="welcome-info-item">
            <span className="welcome-info-icon">🌡️</span>
            <div>
              <strong>Weather-based recommendations</strong>
              <p>Get clothing suggestions based on temperature, wind, and rain</p>
            </div>
          </div>
          
          <div className="welcome-info-item">
            <span className="welcome-info-icon">📍</span>
            <div>
              <strong>Location-aware</strong>
              <p>Uses your current location or any city you choose</p>
            </div>
          </div>
          
          <div className="welcome-info-item">
            <span className="welcome-info-icon">⏰</span>
            <div>
              <strong>Customizable rides</strong>
              <p>Set your ride time and duration for accurate recommendations</p>
            </div>
          </div>
          
          <div className="welcome-info-item">
            <span className="welcome-info-icon">👕</span>
            <div>
              <strong>Customize & share</strong>
              <p>Create custom wardrobes and share them with others</p>
            </div>
          </div>
        </div>

        <div className="welcome-actions">
          <div className="welcome-section">
            <h3>Get Started</h3>
            <p className="welcome-section-text">
              To use the full app, you'll need a free OpenWeather API key. You can get one at{' '}
              <a 
                href="https://openweathermap.org/api/one-call-3" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                openweathermap.org
              </a>
              . The One Call API 3.0 has a free tier available.
            </p>
            <button 
              className="btn btn-primary welcome-btn"
              onClick={handleGetStarted}
            >
              Add API Key
            </button>
          </div>

          <div className="welcome-divider">
            <span>or</span>
          </div>

          <div className="welcome-section">
            <h3>Try Demo Mode</h3>
            <p className="welcome-section-text">
              Want to explore the app first? Try demo mode with randomized weather conditions to see how it works.
            </p>
            <button 
              className="btn btn-secondary welcome-btn"
              onClick={handleTryDemo}
            >
              Try Demo Mode
            </button>
            <p className="welcome-section-note">
              You can always enable or disable demo mode later in the settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

