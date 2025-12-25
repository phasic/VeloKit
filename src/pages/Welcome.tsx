import { useTranslation } from 'react-i18next';
import { storage } from '../utils/storage';
import './Welcome.css';

interface WelcomeProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

export function Welcome({ onGetStarted, onTryDemo }: WelcomeProps) {
  const { t } = useTranslation();
  
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
            alt="VeloKit"
            className="welcome-app-icon"
          />
        </div>
        
        <h1>{t('welcome.title')}</h1>
        
        <p className="welcome-description">
          {t('welcome.description')}
        </p>

        <div className="welcome-info">
          <div className="welcome-info-item">
            <span className="welcome-info-icon">🌡️</span>
            <div>
              <strong>{t('welcome.weatherBased')}</strong>
              <p>{t('welcome.weatherBasedDesc')}</p>
            </div>
          </div>
          
          <div className="welcome-info-item">
            <span className="welcome-info-icon">📍</span>
            <div>
              <strong>{t('welcome.locationAware')}</strong>
              <p>{t('welcome.locationAwareDesc')}</p>
            </div>
          </div>
          
          <div className="welcome-info-item">
            <span className="welcome-info-icon">⏰</span>
            <div>
              <strong>{t('welcome.customizable')}</strong>
              <p>{t('welcome.customizableDesc')}</p>
            </div>
          </div>
          
          <div className="welcome-info-item">
            <span className="welcome-info-icon">👕</span>
            <div>
              <strong>{t('welcome.customizeShare')}</strong>
              <p>{t('welcome.customizeShareDesc')}</p>
            </div>
          </div>
        </div>

        <div className="welcome-actions">
          <div className="welcome-section">
            <h3>{t('welcome.getStarted')}</h3>
            <p className="welcome-section-text">
              {t('welcome.getStartedDesc')}
            </p>
            <button 
              className="btn btn-primary welcome-btn"
              onClick={handleGetStarted}
            >
              {t('welcome.letsGo')}
            </button>
          </div>

          <div className="welcome-divider">
            <span>{t('welcome.or')}</span>
          </div>

          <div className="welcome-section">
            <h3>{t('welcome.tryDemo')}</h3>
            <p className="welcome-section-text">
              {t('welcome.tryDemoDesc')}
            </p>
            <button 
              className="btn btn-secondary welcome-btn"
              onClick={handleTryDemo}
            >
              {t('welcome.tryDemo')}
            </button>
            <p className="welcome-section-note">
              {t('welcome.demoNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

