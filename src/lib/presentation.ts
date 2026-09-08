import type {
  Category,
  Transaction,
  TransactionDraft,
  TransactionType,
  Wallet,
} from '@/types/domain';

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

export function getTransactionPresentation(
  transaction: Transaction,
  categories: Category[],
  wallets: Wallet[],
) {
  const category = categories.find((item) => item.id === transaction.categoryId);
  const wallet = wallets.find((item) => item.id === transaction.walletId);
  return {
    categoryName: category?.name ?? 'Transaksi',
    categoryIcon: category?.icon ?? '◇',
    walletName: wallet?.name ?? 'Dompet',
  };
}

export function getTransactionCategories(categories: Category[], type: TransactionType) {
  if (type === 'adjustment') return [];
  const categoryType = type === 'income' ? 'income' : 'expense';
  return categories.filter(
    (category) =>
      category.type === categoryType &&
      !category.archived &&
      category.systemKey !== 'openingBalance',
  );
}

export function hasSimilarIncome(
  transactions: Transaction[],
  draft: TransactionDraft,
  transactionId?: string,
) {
  return (
    draft.type === 'income' &&
    transactions.some(
      (transaction) =>
        transaction.id !== transactionId &&
        transaction.type === 'income' &&
        transaction.walletId === draft.walletId &&
        transaction.categoryId === draft.categoryId &&
        transaction.amount === draft.amount &&
        transaction.date === draft.date,
    )
  );
}
