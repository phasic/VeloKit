import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { storage } from './utils/storage';

import enTranslations from './locales/en/translation.json';
import nlTranslations from './locales/nl/translation.json';
import frTranslations from './locales/fr/translation.json';

// Get saved language preference or detect from browser
const getInitialLanguage = (): string => {
  const saved = storage.getLanguage();
  if (saved) return saved;
  
  // Detect from browser
  const browserLang = navigator.language.split('-')[0];
  if (['en', 'nl', 'fr'].includes(browserLang)) {
    return browserLang;
  }
  
  return 'en'; // Default to English
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      nl: {
        translation: nlTranslations,
      },
      fr: {
        translation: frTranslations,
      },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  storage.setLanguage(lng);
});

export default i18n;


