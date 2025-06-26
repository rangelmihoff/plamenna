import enTranslations from '@shopify/polaris/locales/en.json';
import frTranslations from '../translations/fr.json';
import esTranslations from '../translations/es.json';
import deTranslations from '../translations/de.json';

const translations = {
  en: enTranslations,
  fr: { ...enTranslations, ...frTranslations },
  es: { ...enTranslations, ...esTranslations },
  de: { ...enTranslations, ...deTranslations },
};

export function getTranslations(locale = 'en') {
  return translations[locale] || translations.en;
}