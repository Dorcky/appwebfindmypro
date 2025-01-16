// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json'; // Fichier de traduction en anglais
import frTranslation from './locales/fr.json'; // Fichier de traduction en français

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enTranslation,
    },
    fr: {
      translation: frTranslation,
    },
  },
  lng: 'en', // Langue par défaut
  fallbackLng: 'en', // Langue de secours en cas d'absence de traduction
  interpolation: {
    escapeValue: false, // React se charge déjà de l'échappement des valeurs
  },
});

export default i18n;
