import type { Transaction } from '@/types/domain';

export function getDailyTransactions(date: string, transactions: Transaction[]) {
  return transactions
    .filter((transaction) => transaction.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getDailyTotals(transactions: Transaction[]) {
  return transactions.reduce(
    (totals, transaction) => {
      if (transaction.type === 'income') totals.income += transaction.amount;
      if (transaction.type === 'expense' || transaction.type === 'adjustment')
        totals.expense += transaction.amount;
      return totals;
    },
    { income: 0, expense: 0 },
  );
}
