import { filterHistoryPeriod, filterHistoryTransactions, getHistoryPage, groupHistoryByDate } from '@/services/history-service';
import type { Transaction } from '@/types/domain';

const transactions: Transaction[] = [
  { id: 'income', type: 'income', walletId: 'cash', toWalletId: null, categoryId: 'salary', amount: 100, date: '2026-09-02', time: '08:00', note: '' },
  { id: 'food', type: 'expense', walletId: 'bank', toWalletId: null, categoryId: 'food', amount: 20, date: '2026-09-01', time: '12:00', note: '' },
  { id: 'transfer', type: 'transfer', walletId: 'cash', toWalletId: 'bank', categoryId: null, amount: 30, date: '2026-08-31', time: '18:00', note: '' },
];

describe('history service', () => {
  it('filters by type, category, and wallet', () => {
    expect(filterHistoryTransactions(transactions, 'income', undefined, 'cash').map(({ id }) => id)).toEqual(['income']);
    expect(filterHistoryTransactions(transactions, 'all', 'food', 'bank').map(({ id }) => id)).toEqual(['food']);
    expect(filterHistoryTransactions(transactions, 'all', undefined, 'missing')).toEqual([]);
  });

  it('filters by an inclusive date range before paging', () => {
    const period = filterHistoryPeriod(transactions, '2026-09-01', '2026-09-02');
    expect(getHistoryPage(1, 1, period).map(({ id }) => id)).toEqual(['income']);
    expect(period.map(({ id }) => id)).toEqual(['income', 'food']);
  });

  it('groups newest days first while preserving transaction order', () => {
    expect(groupHistoryByDate(transactions).map(({ date }) => date)).toEqual(['2026-09-02', '2026-09-01', '2026-08-31']);
  });
});
