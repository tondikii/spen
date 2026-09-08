import i18n from '@/i18n';
import { shiftDate } from '@/lib/calendar';
import type { Locale } from '@/types/domain';

export function getIntlLocale(locale: Locale = 'en'): 'id-ID' | 'en-US' {
  return locale === 'en' ? 'en-US' : 'id-ID';
}

export function formatNumber(value: number, locale: Locale = 'en') {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(value);
}

export function formatDate(value: string | Date, locale: Locale = 'en') {
  return new Intl.DateTimeFormat(getIntlLocale(locale), { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

export function formatDayLabel(date: string, today: string, locale: Locale) {
  if (date === today) return i18n.t('common.today', { lng: locale });
  if (date === shiftDate(today, -1)) return i18n.t('common.yesterday', { lng: locale });
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}
