import { resolveWebLocale } from '@/i18n/web';

describe('web locale resolution', () => {
  it('prefers an explicit URL locale over the browser language', () => {
    expect(resolveWebLocale('?locale=en', 'id-ID')).toBe('en');
    expect(resolveWebLocale('?lang=id', 'en-US')).toBe('id');
  });

  it('uses the browser language and falls back to Indonesian', () => {
    expect(resolveWebLocale('', 'en-US')).toBe('en');
    expect(resolveWebLocale('', 'fr-FR')).toBe('id');
    expect(resolveWebLocale()).toBe('id');
  });
});
