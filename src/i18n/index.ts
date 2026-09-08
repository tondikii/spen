import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { Locale } from '@/types/domain';
import { categoriesEn, categoriesId } from './translations/category-labels';
import { commonEn } from './translations/common-en';
import { commonId } from './translations/common-id';
import { errorsEn, errorsId } from './translations/errors';

export const supportedLocales = ['id', 'en'] as const satisfies readonly Locale[];

export const resources = {
  id: { translation: { common: commonId, errors: errorsId, categories: categoriesId } },
  en: { translation: { common: commonEn, errors: errorsEn, categories: categoriesEn } },
} as const;

export function normalizeLocale(value: unknown): Locale {
  if (typeof value !== 'string') return 'en';
  const language = value.toLowerCase().split('-')[0];
  return language === 'id' ? 'id' : 'en';
}

export function getCurrentLocale(): Locale {
  return normalizeLocale(i18n.language);
}

export async function changeLocale(value: unknown): Promise<Locale> {
  const locale = normalizeLocale(value);
  await i18n.changeLanguage(locale);
  return locale;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  returnNull: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
