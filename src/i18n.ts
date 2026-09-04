import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
export const resources = { id: { translation: { common: { language: 'Bahasa', english: 'Inggris' } } }, en: { translation: { common: { language: 'Language', english: 'English' } } } } as const;
void i18n.use(initReactI18next).init({ resources, lng: 'id', fallbackLng: 'id', interpolation: { escapeValue: false } });
export default i18n;
