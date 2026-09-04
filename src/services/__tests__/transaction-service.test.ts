import mockData from '@/data/mock-data';
import {
  archiveMockCategory,
  getAllocationLimit,
  getMockTransactions,
  saveMockTransaction,
} from '@/services/transaction-service';

describe('transaction service', () => {
  it('mengambil limit alokasi dari kategori yang dipilih', () => {
    expect(getAllocationLimit('category-makan')).toBe(1200000);
    expect(getAllocationLimit('category-gaji')).toBe(0);
  });

  it('mengarsipkan kategori tanpa menghapus row-nya', () => {
    const categories = [mockData.categories[3]];
    const archived = archiveMockCategory(categories, 'category-makan');

    expect(archived).toEqual([{ ...categories[0], archived: true }]);
  });

  it('menyimpan draft transaksi baru dengan id', () => {
    const draft = {
      type: 'expense' as const,
      walletId: 'wallet-gopay',
      toWalletId: null,
      categoryId: 'category-makan',
      amount: 45000,
      date: '2026-09-02',
      time: '12:00',
      note: 'Kopi',
    };

    const saved = saveMockTransaction([], draft);
    expect(saved).toHaveLength(1);
    expect(saved[0]).toEqual(expect.objectContaining(draft));
    expect(saved[0].id).toMatch(/^transaction-/);
    expect(getMockTransactions()).toEqual(expect.arrayContaining([expect.objectContaining(draft)]));
  });
});
