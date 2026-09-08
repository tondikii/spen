import type { SQLiteDatabase } from 'expo-sqlite';

import { netSaving, summarizeLedger, type LedgerType } from '@/lib/domain/ledger';
import { periodFromRow } from '@/lib/domain/period';
import { todayISO } from '@/lib/date';
import { ensureActiveBudgetPlan } from '@/services/plan-service';
import {
  getDatabaseTransactionCategories,
  getDatabaseTransactionsBetween,
} from '@/services/transaction-service';
import type { BudgetPeriod, SystemCategoryKey, Transaction } from '@/types/domain';

export type ReportExpense = {
  categoryId: string;
  name: string;
  systemKey?: SystemCategoryKey | null;
  icon: string;
  amount: number;
};
export type ReportPeriodPoint = { period: BudgetPeriod; netSaving: number };
export type ReportSnapshot = {
  totalIncome: number;
  totalExpense: number;
  totalTransferIn: number;
  totalTransferOut: number;
  netSaving: number;
  spareBudget: number;
};
export type ReportView = {
  snapshot: ReportSnapshot;
  expenses: ReportExpense[];
  period: BudgetPeriod;
  startDay: number;
  periods: BudgetPeriod[];
  netSavingByPeriod: ReportPeriodPoint[];
};

type PeriodRow = { id: number; start_date: string; end_date: string };
type BreakdownRow = { category_id: number; amount: number };

function reportTransactionType(
  transaction: Transaction,
  categoryMap: Map<string, { type: string }>,
): LedgerType {
  if (transaction.type === 'adjustment')
    return categoryMap.get(transaction.categoryId ?? '')?.type === 'income' ? 'income' : 'expense';
  return transaction.type;
}

/**
 * Read model Laporan Periode (ADR-0007): transaksi hanya dimuat dari
 * awal periode tersimpan tertua sampai akhir periode terpilih; rincian
 * Pengeluaran diagregasi SQLite (SUM per kategori); transfer netral.
 */
export async function readReportView(
  database: SQLiteDatabase,
  today?: string,
  selectedPeriodId?: string,
): Promise<ReportView> {
  const asOf = today ?? todayISO();
  const active = await ensureActiveBudgetPlan(database, asOf);
  const periodRows = await database.getAllAsync<PeriodRow>(
    'SELECT id, start_date, end_date FROM budget_periods WHERE start_date <= ? ORDER BY start_date ASC, id ASC;',
    asOf,
  );
  const storedPeriods = periodRows.map(periodFromRow);
  const selectedPeriod =
    storedPeriods.find((candidate) => candidate.id === selectedPeriodId) ??
    periodFromRow(active.period);
  const selectedRow = periodRows.find((row) => `period-${row.id}` === selectedPeriod.id);
  const rangeStart = storedPeriods
    .filter((period) => period.startDate <= selectedPeriod.startDate)
    .reduce(
      (oldest, period) => (period.startDate < oldest ? period.startDate : oldest),
      selectedPeriod.startDate,
    );

  const [transactions, categories, storedPlanned, realizedExpense] = await Promise.all([
    getDatabaseTransactionsBetween(database, rangeStart, selectedPeriod.endDate),
    getDatabaseTransactionCategories(database),
    selectedRow
      ? database.getAllAsync<{ category_id: number; target: number }>(
          `SELECT ei.category_id, SUM(ei.target_amount) AS target
           FROM expense_items ei
           JOIN budget_plans p ON p.id = ei.budget_plan_id
           WHERE p.budget_period_id = ?
           GROUP BY ei.category_id;`,
          selectedRow.id,
        )
      : Promise.resolve([] as { category_id: number; target: number }[]),
    database.getAllAsync<{ category_id: number; amount: number }>(
      `SELECT t.category_id, SUM(t.amount) AS amount
       FROM transactions t
       WHERE t.date >= ? AND t.date <= ? AND t.type = 'expense' AND t.category_id IS NOT NULL
       GROUP BY t.category_id;`,
      selectedPeriod.startDate,
      selectedPeriod.endDate,
    ),
  ]);
  const storedCategoryIds = new Set(storedPlanned.map((row) => `category-${row.category_id}`));
  const plannedTotal =
    storedPlanned.reduce((sum, row) => sum + row.target, 0) +
    realizedExpense
      .filter((row) => !storedCategoryIds.has(`category-${row.category_id}`))
      .reduce((sum, row) => sum + row.amount, 0);
  const breakdown = await database.getAllAsync<BreakdownRow>(
    `SELECT t.category_id, COALESCE(SUM(t.amount), 0) AS amount
     FROM transactions t JOIN categories c ON c.id = t.category_id
     WHERE t.date >= ? AND t.date <= ? AND t.category_id IS NOT NULL
       AND (t.type = 'expense' OR (t.type = 'adjustment' AND c.type = 'expense'))
     GROUP BY t.category_id
     HAVING amount > 0
     ORDER BY amount DESC;`,
    selectedPeriod.startDate,
    selectedPeriod.endDate,
  );
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const expenses = breakdown.map((row) => {
    const categoryId = `category-${row.category_id}`;
    const category = categoryMap.get(categoryId);
    return {
      categoryId,
      name: category?.name ?? 'Kategori',
      systemKey: category?.systemKey ?? null,
      icon: category?.icon ?? '◇',
      amount: row.amount,
    } satisfies ReportExpense;
  });

  const totalsFor = (period: BudgetPeriod) =>
    summarizeLedger(
      transactions.filter(
        (transaction) => transaction.date >= period.startDate && transaction.date <= period.endDate,
      ),
      (transaction) => reportTransactionType(transaction, categoryMap),
    );
  const totals = totalsFor(selectedPeriod);
  const netSavingByPeriod = storedPeriods
    .filter((period) => period.startDate <= selectedPeriod.startDate)
    .map((period) => ({ period, netSaving: netSaving(totalsFor(period)) }));

  return {
    snapshot: {
      totalIncome: totals.income,
      totalExpense: totals.expense,
      totalTransferIn: totals.transferIn,
      totalTransferOut: totals.transferOut,
      netSaving: netSaving(totals),
      spareBudget: totals.income - plannedTotal,
    },
    expenses,
    period: selectedPeriod,
    startDay: active.startDay,
    periods: storedPeriods,
    netSavingByPeriod,
  };
}
