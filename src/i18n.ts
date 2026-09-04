import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
export const resources = { id: { translation: { common: { language: 'Bahasa', english: 'Inggris', cancel: 'Batal', save: 'Simpan', retry: 'Coba lagi', loading: 'Memuat…' } } }, en: { translation: { common: { language: 'Language', english: 'English', cancel: 'Cancel', save: 'Save', retry: 'Retry', loading: 'Loading…' } } } } as const;
void i18n.use(initReactI18next).init({ resources, lng: 'id', fallbackLng: 'id', interpolation: { escapeValue: false } });
export default i18n;
