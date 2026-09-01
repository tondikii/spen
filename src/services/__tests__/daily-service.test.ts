import { getDailyLabel, getDailyTotals, getDailyTransactions, shiftDate } from '@/services/daily-service';
import mockData from '@/data/mock-data';

describe('daily service', () => {
  it('memfilter dan mengurutkan transaksi berdasarkan tanggal dan waktu', () => {
    const transactions = getDailyTransactions('2026-09-01', mockData.transactions);
    expect(transactions[0].id).toBe('transaction-gaji');
    expect(transactions).toHaveLength(7);
  });

  it('menghitung ringkasan Masuk dan Keluar tanpa menghitung Transfer', () => {
    expect(getDailyTotals(mockData.transactions)).toEqual({ income: 6500000, expense: 2950000 });
  });

  it('menggeser tanggal dan memberi label relatif', () => {
    expect(shiftDate('2026-09-01', -1)).toBe('2026-08-31');
    expect(getDailyLabel('2026-09-01')).toBe('Hari Ini');
    expect(getDailyLabel('2026-08-31')).toBe('Kemarin');
  });
});
