import { formatMoney } from '@/lib/money';
import { changeLocale } from '@/i18n';

afterEach(async () => {
  await changeLocale('id');
});

describe('formatMoney', () => {
  it('memformat nominal dengan format id-ID tanpa desimal', () => {
    expect(formatMoney(2500000)).toBe('Rp 2.500.000');
  });

  it('mendukung currency lain tanpa konversi', () => {
    expect(formatMoney(2500000, 'USD')).toBe('US$ 2.500.000');
  });

  it('mengikuti locale aktif saat memformat angka', async () => {
    await changeLocale('en');
    expect(formatMoney(2500000, 'USD')).toBe('US$ 2,500,000');
  });
});
