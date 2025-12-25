import { useTranslation } from 'react-i18next';
import { Page } from '../types';

interface BottomTabBarProps {
  currentPage: Page;
  onHome: () => void;
  onCustom: () => void;
  onGuide: () => void;
  customLoading?: boolean;
}

export function BottomTabBar({ currentPage, onHome, onCustom, onGuide, customLoading = false }: BottomTabBarProps) {
  const { t } = useTranslation();
  
  return (
    <div className="ios-tab-bar">
      <button
        className={`ios-tab-item ${currentPage === 'home' ? 'active' : ''}`}
        onClick={onHome}
      >
        <div 
          className="ios-tab-icon-wrapper"
          style={currentPage === 'home' ? {
            '--icon-mask-url': `url(${import.meta.env.BASE_URL}flash.png)`
          } as React.CSSProperties : undefined}
        >
          <img 
            src={`${import.meta.env.BASE_URL}flash.png`} 
            alt={t('home.quickView')} 
            className="ios-tab-icon"
          />
        </div>
        <span className="ios-tab-label">{t('home.quickView')}</span>
      </button>
      <button
        className={`ios-tab-item ${(currentPage === 'setup' || currentPage === 'recommendation') ? 'active' : ''}`}
        onClick={onCustom}
        disabled={customLoading}
      >
        <div 
          className="ios-tab-icon-wrapper"
          style={(currentPage === 'setup' || currentPage === 'recommendation') ? {
            '--icon-mask-url': `url(${import.meta.env.BASE_URL}equalizer.png)`
          } as React.CSSProperties : undefined}
        >
          <img 
            src={`${import.meta.env.BASE_URL}equalizer.png`} 
            alt={t('home.custom')} 
            className="ios-tab-icon"
          />
        </div>
        <span className="ios-tab-label">{customLoading ? t('common.loading') : t('home.custom')}</span>
      </button>
      <button
        className={`ios-tab-item ${currentPage === 'guide' ? 'active' : ''}`}
        onClick={onGuide}
      >
        <div 
          className="ios-tab-icon-wrapper"
          style={currentPage === 'guide' ? {
            '--icon-mask-url': `url(${import.meta.env.BASE_URL}wardrobe.png)`
          } as React.CSSProperties : undefined}
        >
          <img 
            src={`${import.meta.env.BASE_URL}wardrobe.png`} 
            alt={t('home.wardrobe')} 
            className="ios-tab-icon"
          />
        </div>
        <span className="ios-tab-label">{t('home.wardrobe')}</span>
      </button>
    </div>
  );
}

