import { Page } from '../types';

interface BottomTabBarProps {
  currentPage: Page;
  onHome: () => void;
  onCustom: () => void;
  onGuide: () => void;
  customLoading?: boolean;
}

export function BottomTabBar({ currentPage, onHome, onCustom, onGuide, customLoading = false }: BottomTabBarProps) {
  return (
    <div className="ios-tab-bar">
      <button
        className={`ios-tab-item ${currentPage === 'home' ? 'active' : ''}`}
        onClick={onHome}
      >
        <img 
          src={`${import.meta.env.BASE_URL}flash.png`} 
          alt="Quick view" 
          className="ios-tab-icon"
        />
        <span className="ios-tab-label">Quick view</span>
      </button>
      <button
        className={`ios-tab-item ${currentPage === 'setup' ? 'active' : ''}`}
        onClick={onCustom}
        disabled={customLoading}
      >
        <img 
          src={`${import.meta.env.BASE_URL}equalizer.png`} 
          alt="Custom" 
          className="ios-tab-icon"
        />
        <span className="ios-tab-label">{customLoading ? 'Loading...' : 'Custom'}</span>
      </button>
      <button
        className={`ios-tab-item ${currentPage === 'guide' ? 'active' : ''}`}
        onClick={onGuide}
      >
        <img 
          src={`${import.meta.env.BASE_URL}wardrobe.png`} 
          alt="Wardrobe" 
          className="ios-tab-icon"
        />
        <span className="ios-tab-label">Wardrobe</span>
      </button>
    </div>
  );
}

