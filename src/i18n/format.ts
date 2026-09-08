import i18n from '@/i18n';
import { shiftDate } from '@/utils/date';
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

/** Nama bulan panjang untuk `YYYY-MM-DD` (mis. "September"). */
export function formatMonth(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: 'long',
  }).format(new Date(`${date}T12:00:00`));
}

/** Nama bulan singkat untuk `YYYY-MM-DD` (mis. "Sep"). */
export function formatMonthShort(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}

/** Tanggal pendek untuk `YYYY-MM-DD` (mis. "2 Sep"). */
export function formatDayMonth(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}

/** Tanggal lengkap dengan hari untuk `YYYY-MM-DD` (mis. "Rabu, 2 September 2026"). */
export function formatWeekdayDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}
