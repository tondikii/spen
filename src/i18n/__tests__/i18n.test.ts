import i18n, {
  changeLocale,
  getCurrentLocale,
  normalizeLocale,
  resources,
  supportedLocales,
} from '@/i18n';
import { formatDate, formatNumber, getIntlLocale } from '@/i18n/format';

describe('localization boundary', () => {
  afterEach(async () => {
    await changeLocale('id');
  });

  it('keeps the same translation keys in every supported locale', () => {
    const idKeys = Object.keys(resources.id.translation.common).sort();
    const enKeys = Object.keys(resources.en.translation.common).sort();
    const idErrorKeys = Object.keys(resources.id.translation.errors).sort();
    const enErrorKeys = Object.keys(resources.en.translation.errors).sort();

    expect(supportedLocales).toEqual(['id', 'en']);
    expect(enKeys).toEqual(idKeys);
    expect(enErrorKeys).toEqual(idErrorKeys);
  });

  it('changes the active locale through one public boundary', async () => {
    await changeLocale('en');

    expect(getCurrentLocale()).toBe('en');
    expect(i18n.t('common.home')).toBe('Home');

    await changeLocale('id');

    expect(getCurrentLocale()).toBe('id');
    expect(i18n.t('common.home')).toBe('Beranda');
  });

  it('normalizes unsupported locale values to the default locale', () => {
    expect(normalizeLocale('en')).toBe('en');
    expect(normalizeLocale('en-US')).toBe('en');
    expect(normalizeLocale('id-ID')).toBe('id');
    expect(normalizeLocale('fr')).toBe('id');
    expect(normalizeLocale(undefined)).toBe('id');
  });

  it('formats dates and numbers using the requested locale', () => {
    expect(getIntlLocale('id')).toBe('id-ID');
    expect(getIntlLocale('en')).toBe('en-US');
    expect(formatNumber(1234567, 'id')).toBe('1.234.567');
    expect(formatNumber(1234567, 'en')).toBe('1,234,567');
    expect(formatDate('2026-09-05', 'id')).toContain('5 Sep 2026');
    expect(formatDate('2026-09-05', 'en')).toContain('Sep 5, 2026');
  });
});
