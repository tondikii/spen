import type { Locale } from '@/types/domain';

export function getIntlLocale(locale: Locale = 'id'): 'id-ID' | 'en-US' {
  return locale === 'en' ? 'en-US' : 'id-ID';
}

export function formatNumber(value: number, locale: Locale = 'id') {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(value);
}

export function formatDate(value: string | Date, locale: Locale = 'id') {
  return new Intl.DateTimeFormat(getIntlLocale(locale), { dateStyle: 'medium' }).format(
    new Date(value),
  );
}
