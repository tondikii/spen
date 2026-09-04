import type { Locale } from '@/types/domain';
export function formatNumber(value: number, locale: Locale = 'id') { return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'id-ID').format(value); }
export function formatDate(value: string | Date, locale: Locale = 'id') { return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', { dateStyle: 'medium' }).format(new Date(value)); }
