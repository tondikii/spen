import { resolveWebLocale } from '@/i18n/web';

describe('web locale resolution', () => {
  it('prefers an explicit URL locale over the browser language', () => {
    expect(resolveWebLocale('?locale=en', 'id-ID')).toBe('en');
    expect(resolveWebLocale('?lang=id', 'en-US')).toBe('id');
  });

  it('uses the browser language and falls back to English', () => {
    expect(resolveWebLocale('', 'en-US')).toBe('en');
    expect(resolveWebLocale('', 'id-ID')).toBe('id');
    expect(resolveWebLocale('', 'fr-FR')).toBe('en');
    expect(resolveWebLocale('?lang=fr', 'en-US')).toBe('en');
    expect(resolveWebLocale()).toBe('en');
  });
});
