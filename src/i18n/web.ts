import { normalizeLocale } from '@/i18n';
import type { Locale } from '@/types/domain';

export function resolveWebLocale(search = '', navigatorLanguage = ''): Locale {
  const params = new URLSearchParams(search);
  const urlLocale = params.get('locale') ?? params.get('lang');
  if (urlLocale) {
    const normalized = normalizeLocale(urlLocale);
    return /^(id|en)(?:-|$)/i.test(urlLocale) ? normalized : 'id';
  }
  return /^(id|en)(?:-|$)/i.test(navigatorLanguage) ? normalizeLocale(navigatorLanguage) : 'id';
}

export function getWebLocale(): Locale {
  if (typeof window === 'undefined') return 'id';
  return resolveWebLocale(window.location.search, window.navigator.language);
}
