import { normalizeLocale } from '@/i18n';
import type { Locale } from '@/types/domain';

export function resolveWebLocale(search = '', navigatorLanguage = ''): Locale {
  const params = new URLSearchParams(search);
  const urlLocale = params.get('locale') ?? params.get('lang');
  if (urlLocale) return normalizeLocale(urlLocale);
  return normalizeLocale(navigatorLanguage);
}

export function getWebLocale(): Locale {
  if (typeof window === 'undefined') return 'id';
  return resolveWebLocale(window.location.search, window.navigator.language);
}
