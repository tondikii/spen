import { formatDayLabel } from '@/i18n/format';
import { shiftDate } from '@/lib/calendar';
import { getDailyTotals, getDailyTransactions } from '@/lib/presentation';
import type { Transaction } from '@/types/domain';

const transactions: Transaction[] = [
  {
    id: 'transaction-1',
    type: 'expense',
    walletId: 'wallet-1',
    toWalletId: null,
    categoryId: 'category-food',
    amount: 20000,
    date: '2026-09-01',
    time: '09:00',
    note: 'Makan siang',
  },
  {
    id: 'transaction-2',
    type: 'income',
    walletId: 'wallet-1',
    toWalletId: null,
    categoryId: 'category-income',
    amount: 500000,
    date: '2026-09-01',
    time: '07:00',
    note: 'Gaji',
  },
  {
    id: 'transaction-3',
    type: 'expense',
    walletId: 'wallet-1',
    toWalletId: null,
    categoryId: 'category-food',
    amount: 15000,
    date: '2026-09-01',
    time: '08:00',
    note: 'Kopi',
  },
  {
    id: 'transaction-4',
    type: 'transfer',
    walletId: 'wallet-1',
    toWalletId: 'wallet-2',
    categoryId: 'category-transfer',
    amount: 100000,
    date: '2026-09-01',
    time: '10:00',
    note: 'Ke BCA',
  },
];

describe('daily presentation helpers', () => {
  it('memfilter dan mengurutkan transaksi berdasarkan tanggal dan waktu', () => {
    const daily = getDailyTransactions('2026-09-01', transactions);
    expect(daily.map((transaction) => transaction.id)).toEqual([
      'transaction-2',
      'transaction-3',
      'transaction-1',
      'transaction-4',
    ]);
  });

  it('tidak menyertakan transaksi di luar tanggal', () => {
    expect(getDailyTransactions('2026-09-02', transactions)).toEqual([]);
  });

  it('menghitung ringkasan Masuk dan Keluar tanpa menghitung Transfer', () => {
    expect(getDailyTotals(getDailyTransactions('2026-09-01', transactions))).toEqual({
      income: 500000,
      expense: 35000,
    });
  });

  it('menggeser tanggal dan memberi label relatif', () => {
    expect(shiftDate('2026-09-01', -1)).toBe('2026-08-31');
    expect(formatDayLabel('2026-09-01', '2026-09-01', 'id')).toBe('Hari Ini');
    expect(formatDayLabel('2026-08-31', '2026-09-01', 'id')).toBe('Kemarin');
    expect(formatDayLabel('2026-09-01', '2026-09-01', 'en')).toBe('Today');
    expect(formatDayLabel('2026-08-31', '2026-09-01', 'en')).toBe('Yesterday');
  });
});
