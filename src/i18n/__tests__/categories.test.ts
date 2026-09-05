import { getCategoryLabel } from '@/i18n/categories';

describe('localized system categories', () => {
  it('translates a system category while keeping custom names unchanged', () => {
    expect(getCategoryLabel({ name: 'Gaji', systemKey: 'salary' }, 'id')).toBe('Gaji');
    expect(getCategoryLabel({ name: 'Gaji', systemKey: 'salary' }, 'en')).toBe('Salary');
    expect(getCategoryLabel({ name: 'Makan Buatan', systemKey: null }, 'en')).toBe('Makan Buatan');
  });
});
