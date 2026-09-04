import mockData from '@/data/mock-data';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  getDatabaseTransactionCategories,
  getDatabaseTransactions,
} from '@/services/transaction-service';
import { ensureActiveBudgetPlan } from '@/services/plan-service';
import type { BudgetPeriod, MockBudgetSnapshot } from '@/types/domain';

export type ReportExpense = { categoryId: string; name: string; icon: string; amount: number };
export type ReportPeriodPoint = { period: BudgetPeriod; netSaving: number };

export type ReportView = {
  snapshot: MockBudgetSnapshot;
  expenses: ReportExpense[];
  period: BudgetPeriod;
  netSavingByPeriod: ReportPeriodPoint[];
};

export function getReportView() {
  const categoryMap = new Map(mockData.categories.map((category) => [category.id, category]));
  const expenses = mockData.categories
    .filter((category) => category.type === 'expense')
    .map((category) => ({
      categoryId: category.id,
      name: category.name,
      icon: category.icon,
      amount: mockData.transactions
        .filter(
          (transaction) =>
            reportTransactionType(transaction, categoryMap) === 'expense' &&
            transaction.categoryId === category.id,
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  return {
    snapshot: mockData.budgetSnapshot,
    expenses,
    period: mockData.budgetPeriods[0],
    netSavingByPeriod: mockData.budgetPeriods.map((period) => ({
      period,
      netSaving: mockData.budgetSnapshot.netSaving,
    })),
  } satisfies ReportView;
}

type PeriodRow = { id: number; start_date: string; end_date: string; duration_months: number };

function toPeriod(row: PeriodRow): BudgetPeriod {
  return {
    id: `period-${row.id}`,
    startDate: row.start_date,
    endDate: row.end_date,
    durationMonths: 1,
  };
}

export async function getDatabaseReportView(
  database: SQLiteDatabase,
  rangeMonths = 3,
  today?: string,
): Promise<ReportView> {
  const active = await ensureActiveBudgetPlan(database, today);
  const period = toPeriod(active.period);
  const [transactions, categories, periodRows] = await Promise.all([
    getDatabaseTransactions(database),
    getDatabaseTransactionCategories(database),
    database.getAllAsync<PeriodRow>(
      'SELECT id, start_date, end_date, duration_months FROM budget_periods ORDER BY start_date DESC, id DESC LIMIT ?;',
      Math.max(1, Math.trunc(rangeMonths)),
    ),
  ]);
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const activeTransactions = transactions.filter(
    (transaction) => transaction.date >= period.startDate && transaction.date <= period.endDate,
  );
  const expenses = [
    ...new Map(
      activeTransactions
        .filter(
          (transaction) =>
            reportTransactionType(transaction, categoryMap) === 'expense' && transaction.categoryId,
        )
        .map((transaction) => {
          const category = categoryMap.get(transaction.categoryId!);
          return [
            transaction.categoryId!,
            {
              categoryId: transaction.categoryId!,
              name: category?.name ?? 'Kategori',
              icon: category?.icon ?? '◇',
              amount: 0,
            },
          ];
        }),
    ).values(),
  ]
    .map((expense) => ({
      ...expense,
      amount: activeTransactions
        .filter(
          (transaction) =>
            reportTransactionType(transaction, categoryMap) === 'expense' &&
            transaction.categoryId === expense.categoryId,
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }))
    .filter((expense) => expense.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const totalsFor = (range: BudgetPeriod) =>
    activeTransactionsFor(transactions, range).reduce(
      (totals, transaction) => {
        const type = reportTransactionType(transaction, categoryMap);
        if (type === 'income') totals.income += transaction.amount;
        if (type === 'expense') totals.expense += transaction.amount;
        if (transaction.type === 'transfer' && transaction.toWalletId)
          totals.transferIn += transaction.amount;
        if (transaction.type === 'transfer' && transaction.walletId)
          totals.transferOut += transaction.amount + (transaction.adminFee ?? 0);
        return totals;
      },
      { income: 0, expense: 0, transferIn: 0, transferOut: 0 },
    );
  const totals = totalsFor(period);
  const netSavingByPeriod = [...periodRows].reverse().map((row) => {
    const item = toPeriod(row);
    const periodTotals = totalsFor(item);
    return {
      period: item,
      netSaving:
        periodTotals.income -
        periodTotals.expense -
        periodTotals.transferOut +
        periodTotals.transferIn,
    };
  });
  const snapshot: MockBudgetSnapshot = {
    totalIncome: totals.income,
    totalExpense: totals.expense,
    totalTransferIn: totals.transferIn,
    totalTransferOut: totals.transferOut,
    netSaving: totals.income - totals.expense - totals.transferOut + totals.transferIn,
    spareBudget: 0,
    availableBalance: 0,
    freeBalance: 0,
    goalBalance: 0,
    planItems: [],
  };
  return { snapshot, expenses, period, netSavingByPeriod };
}

function activeTransactionsFor(
  transactions: Awaited<ReturnType<typeof getDatabaseTransactions>>,
  period: BudgetPeriod,
) {
  return transactions.filter(
    (transaction) => transaction.date >= period.startDate && transaction.date <= period.endDate,
  );
}

function reportTransactionType(
  transaction: Awaited<ReturnType<typeof getDatabaseTransactions>>[number],
  categoryMap: Map<string, { type: string }>,
) {
  if (transaction.type === 'adjustment')
    return categoryMap.get(transaction.categoryId ?? '')?.type === 'income' ? 'income' : 'expense';
  return transaction.type;
}

export function getReportNetSavingLabel(netSaving: number) {
  return netSaving < 0 ? 'Defisit' : 'Net saving';
}
