import { normalizeLocale } from '@/i18n';
import type { Locale } from '@/types/domain';

// Web: prioritas URL, lalu preferensi browser, lalu English sebagai default
// (ADR-0006, CONTEXT.md). Bahasa Indonesia hanya dipilih saat eksplisit.
export function resolveWebLocale(search = '', navigatorLanguage = ''): Locale {
  const params = new URLSearchParams(search);
  const urlLocale = params.get('locale') ?? params.get('lang');
  if (urlLocale) {
    const normalized = normalizeLocale(urlLocale);
    return /^(id|en)(?:-|$)/i.test(urlLocale) ? normalized : 'en';
  }
  return /^(id|en)(?:-|$)/i.test(navigatorLanguage) ? normalizeLocale(navigatorLanguage) : 'en';
}

export function getWebLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  return resolveWebLocale(window.location.search, window.navigator.language);
}
