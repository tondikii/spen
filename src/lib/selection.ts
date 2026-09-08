import type { CurrencyCode, Locale } from '@/types/domain';

// Selected currency and locale are process-wide presentation state mirrored
// from the settings table at startup and updated through the settings feature.
let selectedCurrency: CurrencyCode = 'IDR';
let selectedLocale: Locale = 'en';

export const currencyOptions: CurrencyCode[] = [
  'IDR',
  'USD',
  'SGD',
  'MYR',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'SAR',
  'AED',
];

export function getSelectedCurrency() {
  return selectedCurrency;
}
export function setSelectedCurrency(currency: CurrencyCode) {
  selectedCurrency = currency;
  return selectedCurrency;
}
export function getSelectedLocale() {
  return selectedLocale;
}
export function setSelectedLocale(locale: Locale) {
  selectedLocale = locale;
  return locale;
}
