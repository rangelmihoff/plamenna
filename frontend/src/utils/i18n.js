import { useState, useEffect, useContext, createContext } from 'react';

// Import translation files
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';
import esTranslations from '../locales/es.json';
import deTranslations from '../locales/de.json';

const I18nContext = createContext();

// All translations combined
const translations = {
  en: enTranslations,
  fr: frTranslations,
  es: esTranslations,
  de: deTranslations
};

export const I18nProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [currentTranslations, setCurrentTranslations] = useState(translations.en);

  useEffect(() => {
    // Load saved language from localStorage or browser preference
    const savedLanguage = localStorage.getItem('ai-seo-language') || 
                         navigator.language.split('-')[0] || 
                         'en';
    
    changeLanguage(savedLanguage);
  }, []);

  const changeLanguage = (language) => {
    if (translations[language]) {
      setCurrentLanguage(language);
      setCurrentTranslations(translations[language]);
      localStorage.setItem('ai-seo-language', language);
      
      // Update document language attribute
      document.documentElement.lang = language;
    } else {
      console.warn(`Language '${language}' not supported. Falling back to English.`);
      setCurrentLanguage('en');
      setCurrentTranslations(translations.en);
    }
  };

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = currentTranslations;

    // Navigate through the nested object
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation missing for key: ${key} in language: ${currentLanguage}`);
        
        // Fallback to English if key is missing
        if (currentLanguage !== 'en') {
          let fallbackValue = translations.en;
          for (const fk of keys) {
            fallbackValue = fallbackValue?.[fk];
            if (fallbackValue === undefined) break;
          }
          if (fallbackValue !== undefined) {
            return typeof fallbackValue === 'string' ? 
              replaceParams(fallbackValue, params) : fallbackValue;
          }
        }
        
        // Return the key if no translation found
        return key;
      }
    }

    // Replace parameters in the translation
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return replaceParams(value, params);
    }

    return value;
  };

  // Helper function to replace parameters
  const replaceParams = (text, params) => {
    return text.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  };

  // Get available languages
  const getAvailableLanguages = () => {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' }
    ];
  };

  // Format numbers according to locale
  const formatNumber = (number, options = {}) => {
    const locale = getLocaleFromLanguage(currentLanguage);
    return new Intl.NumberFormat(locale, options).format(number);
  };

  // Format currency according to locale
  const formatCurrency = (amount, currency = 'USD') => {
    const locale = getLocaleFromLanguage(currentLanguage);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format dates according to locale
  const formatDate = (date, options = {}) => {
    const locale = getLocaleFromLanguage(currentLanguage);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }).format(new Date(date));
  };

  // Format relative time (e.g., "2 days ago")
  const formatRelativeTime = (date) => {
    const locale = getLocaleFromLanguage(currentLanguage);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    const now = new Date();
    const target = new Date(date);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (Math.abs(diffDays) < 1) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      if (Math.abs(diffHours) < 1) {
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));
        return rtf.format(diffMinutes, 'minute');
      }
      return rtf.format(diffHours, 'hour');
    }
    
    if (Math.abs(diffDays) < 7) {
      return rtf.format(diffDays, 'day');
    }
    
    const diffWeeks = Math.ceil(diffDays / 7);
    if (Math.abs(diffWeeks) < 4) {
      return rtf.format(diffWeeks, 'week');
    }
    
    const diffMonths = Math.ceil(diffDays / 30);
    return rtf.format(diffMonths, 'month');
  };

  // Helper to get locale code from language
  const getLocaleFromLanguage = (language) => {
    const localeMap = {
      'en': 'en-US',
      'fr': 'fr-FR',
      'es': 'es-ES',
      'de': 'de-DE'
    };
    return localeMap[language] || 'en-US';
  };

  // Check if text direction is RTL (for future Arabic support)
  const isRTL = () => {
    const rtlLanguages = ['ar', 'he', 'fa'];
    return rtlLanguages.includes(currentLanguage);
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    getAvailableLanguages,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    isRTL
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const translations = {
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Overview of your store\'s SEO performance',
    'dashboard.sync_products': 'Sync Products',
    'dashboard.refresh': 'Refresh',
    'dashboard.trial_active': 'Trial Active',
    'dashboard.upgrade_now': 'Upgrade Now',
    'dashboard.trial_expires': 'Trial expires in {days} days',
    'dashboard.total_products': 'Total Products',
    'dashboard.optimized': 'optimized',
    'dashboard.avg_seo_score': 'Average SEO Score',
    'dashboard.this_month': 'this month',
    'dashboard.ai_usage': 'AI Usage',
    'dashboard.view_all': 'View All',
    'dashboard.generate_seo': 'Generate SEO',
    'dashboard.manage_products': 'Manage Products',
    'dashboard.app_settings': 'App Settings',
    'dashboard.next_sync': 'Next sync',
    'dashboard.not_optimized': 'Not optimized',
    'dashboard.excellent': 'Excellent',
    'dashboard.good': 'Good',
    'dashboard.needs_work': 'Needs Work',
    'dashboard.pending': 'Pending',
    'dashboard.error.loading': 'Error loading dashboard data',
    'dashboard.refreshed': 'Dashboard refreshed',
    'dashboard.sync.started': 'Product sync started',
    'dashboard.sync.error': 'Error starting product sync'
  };

  const t = (key, params = {}) => {
    let text = translations[key] || key;
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, value);
    });
    return text;
  };

  return { t };
};

// Export individual translation objects for direct use if needed
export { translations };