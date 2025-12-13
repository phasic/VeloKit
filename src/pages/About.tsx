import './About.css';

interface AboutProps {
  onBack: () => void;
}

export function About({ onBack }: AboutProps) {
  return (
    <div className="page about">
      <h2>About</h2>

      <div className="about-section">
        <h3>DressMyRide</h3>
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
            </div>
          </div>

          {/* Add more attribution items as needed */}
        </div>
      </div>

      <div className="about-section">
        <h3>Version</h3>
        <p>1.0.0</p>
      </div>

      <button className="btn btn-secondary" onClick={onBack}>
        Back
      </button>
    </div>
  );
}

