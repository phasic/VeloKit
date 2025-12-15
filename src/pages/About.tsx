import { useEffect } from 'react';
import './About.css';

interface AboutProps {
  onBack: () => void;
}

export function About({ onBack }: AboutProps) {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="page about" style={{ paddingBottom: '100px' }}>
      <h2>About</h2>

      <div className="about-section">
        <h3>VeloKit</h3>
        <p>
          A mobile-first Progressive Web App that recommends cycling clothes based on weather conditions at your location.
        </p>
      </div>

      <div className="about-section">
        <h3>Attributions</h3>
        <p className="about-subtitle">Assets and resources used in this app:</p>
        
        <div className="attribution-list">
          <div className="attribution-item">
            <div className="attribution-title">Weather Data</div>
            <div className="attribution-details">
              <a href="https://openweathermap.org" target="_blank" rel="noopener noreferrer">
                OpenWeatherMap
              </a>
              <span className="attribution-note">One Call API 3.0</span>
            </div>
          </div>

          <div className="attribution-item">
            <div className="attribution-title">Map Library</div>
            <div className="attribution-details">
              <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">
                Leaflet
              </a>
              <span className="attribution-note">Open source JavaScript library for mobile-friendly interactive maps</span>
            </div>
          </div>

          <div className="attribution-item">
            <div className="attribution-title">Chart Library</div>
            <div className="attribution-details">
              <a href="https://recharts.org" target="_blank" rel="noopener noreferrer">
                Recharts
              </a>
              <span className="attribution-note">Composable charting library built on React components</span>
            </div>
          </div>

          <div className="attribution-item">
            <div className="attribution-title">Map Data</div>
            <div className="attribution-details">
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
                © OpenStreetMap contributors
              </a>
              <span className="attribution-note">Map tiles and geocoding data</span>
            </div>
          </div>

          <div className="attribution-item">
            <div className="attribution-title">Icons & Assets</div>
            <div className="attribution-details">
              <a href="https://www.flaticon.com/free-icons/refresh" target="_blank" rel="noopener noreferrer">
                Refresh icons created by Creative Stall Premium - Flaticon
              </a>
              <a href="https://www.flaticon.com/free-icons/lightning" target="_blank" rel="noopener noreferrer">
                Lightning icons created by Roundicons Premium - Flaticon
              </a>
              <a href="https://www.flaticon.com/free-icons/customize" target="_blank" rel="noopener noreferrer">
                Customize icons created by th studio - Flaticon
              </a>
              <a href="https://www.flaticon.com/free-icons/closet" target="_blank" rel="noopener noreferrer">
                Closet icons created by Rabit Jes - Flaticon
              </a>
              <a href="https://www.flaticon.com/free-icons/settings" target="_blank" rel="noopener noreferrer">
                Settings icons created by Freepik - Flaticon
              </a>
              <a href="https://www.flaticon.com/free-icons/installer" target="_blank" rel="noopener noreferrer">
                Installer icons created by Abdul-Aziz - Flaticon
              </a>
              <a href="https://www.flaticon.com/free-icons/open-hands" target="_blank" rel="noopener noreferrer">
                Open hands icons created by Icon Mart - Flaticon
              </a>
              <a href="https://www.flaticon.com/free-icons/temperature" target="_blank" rel="noopener noreferrer">
                Temperature icons created by Freepik - Flaticon
              </a>
              <a href="https://www.flaticon.com/free-icons/wind-speed" target="_blank" rel="noopener noreferrer">
                Wind speed icons created by Nendra Wahyu - Flaticon
              </a>
              <a href="https://www.flaticon.com/free-icons/rain" target="_blank" rel="noopener noreferrer">
                Rain icons created by bqlqn - Flaticon
              </a>
            </div>
          </div>

          {/* Add more attribution items as needed */}
        </div>
      </div>

      <div className="about-section">
        <h3>Version</h3>
        <p>1.0.0-883ce73</p>
      </div>

      <div className="about-sticky-actions">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}

