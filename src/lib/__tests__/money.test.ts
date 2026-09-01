import { formatMoney } from '@/lib/money';

describe('formatMoney', () => {
  it('memformat nominal dengan format id-ID tanpa desimal', () => {
    expect(formatMoney(2500000)).toBe('Rp 2.500.000');
  });

  it('mendukung currency lain tanpa konversi', () => {
    expect(formatMoney(2500000, 'USD')).toBe('US$ 2.500.000');
  });
});
