import i18n, { getCurrentLocale } from '@/i18n';
import { getIntlLocale } from '@/i18n/format';
import { getMockTransactions } from '@/services/transaction-service';
import type { Locale, Transaction } from '@/types/domain';

export function getDailyTransactions(
  date: string,
  transactions: Transaction[] = getMockTransactions(),
) {
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

export function shiftDate(date: string, days: number) {
  const shifted = new Date(`${date}T12:00:00`);
  shifted.setDate(shifted.getDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export function getDailyLabel(
  date: string,
  today = '2026-09-01',
  locale: Locale = getCurrentLocale(),
) {
  if (date === today) return i18n.t('common.today', { lng: locale });
  if (date === shiftDate(today, -1)) return i18n.t('common.yesterday', { lng: locale });
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00`));
}
