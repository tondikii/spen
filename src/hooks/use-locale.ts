import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '@/i18n';
import { getIntlLocale } from '@/i18n/format';
import type { Locale } from '@/types/domain';

export function useLocale(): Locale {
  const { i18n: hookI18n } = useTranslation();
  return (hookI18n.language === 'en' ? 'en' : 'id') as Locale;
}

export function useIntlLocale(): string {
  const locale = useLocale();
  return getIntlLocale(locale);
}

/** Non-hook version for use outside React */
export function getCurrentLocale(): Locale {
  return (i18n.language === 'en' ? 'en' : 'id') as Locale;
}

export function getCurrentIntlLocale(): string {
  return getIntlLocale(getCurrentLocale());
}
