import { getMockTransactions } from '@/services/transaction-service';
import type { Transaction } from '@/types/domain';

export type HistoryFilter = 'all' | 'expense' | 'income' | 'transfer';

export function filterHistoryTransactions(transactions: Transaction[], filter: HistoryFilter, categoryId?: string, walletId?: string) {
  return transactions.filter((transaction) => {
    if (categoryId && transaction.categoryId !== categoryId) return false;
    if (walletId && transaction.walletId !== walletId && transaction.toWalletId !== walletId) return false;
    if (filter === 'all') return true;
    return filter === transaction.type || (filter === 'expense' && transaction.type === 'adjustment');
  });
}

export function filterHistoryPeriod(transactions: Transaction[], startDate?: string, endDate?: string) {
  return transactions.filter((transaction) => (!startDate || transaction.date >= startDate) && (!endDate || transaction.date <= endDate));
}

export function groupHistoryByDate(transactions: Transaction[]) {
  const grouped = new Map<string, Transaction[]>();
  [...transactions].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).forEach((transaction) => {
    grouped.set(transaction.date, [...(grouped.get(transaction.date) ?? []), transaction]);
  });
  return Array.from(grouped, ([date, data]) => ({ date, data }));
}

export function getHistoryPage(page: number, pageSize = 5, transactions: Transaction[] = getMockTransactions()) {
  return transactions.slice(0, page * pageSize);
}
