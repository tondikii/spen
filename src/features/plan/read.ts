import type { SQLiteDatabase } from 'expo-sqlite';

import {
  expenseProgress,
  netSaving,
  realizedForCategory,
  summarizeLedger,
  walletTotal,
} from '@/utils/domain/ledger';
import { periodFromRow } from '@/utils/domain/period';
import { todayISO } from '@/utils/date';
import i18n from '@/i18n';
import { ensureActiveBudgetPlan } from './data/plan-repository';
import {
  getDatabaseTransactionCategories,
  getDatabaseTransactionsBetween,
} from '@/features/transactions';
import { getWallets } from '@/features/wallet';
import type {
  AllocationItem,
  BudgetPlan,
  BudgetPlanItem,
  BudgetPeriod,
  BudgetSnapshot,
  Category,
  ExpenseItem,
  FixedExpenseItem,
  Goal,
  IncomeItem,
  PlanItemState,
  PlanItemType,
  Wallet,
} from '@/types/domain';
import type { GoalRow, ItemRow } from '@/types/db-rows';

export type PlanView = {
  snapshot: BudgetSnapshot;
  plan: BudgetPlan;
  goals: Goal[];
  wallets: Wallet[];
  period: BudgetPeriod;
  startDay: number;
};
export type PlanRead = { planView: PlanView; categories: Category[] };

function toItem(row: ItemRow, type: PlanItemType): BudgetPlanItem {
  const common = {
    id: `${type}-item-${row.id}`,
    name: row.name,
    categoryId: `category-${row.category_id}`,
    targetAmount: row.target_amount,
  };
  if (type === 'income')
    return {
      ...common,
      type: 'income',
      ...(row.wallet_id ? { walletId: `wallet-${row.wallet_id}` } : {}),
    } satisfies IncomeItem;
  if (type === 'fixedExpense')
    return { ...common, type: 'fixedExpense' } satisfies FixedExpenseItem;
  if (type === 'allocation') return { ...common, type: 'allocation' } satisfies AllocationItem;
  return { ...common, type: 'expense', isPaid: Boolean(row.is_paid) } satisfies ExpenseItem;
}

function toGoal(row: GoalRow): Goal {
  return {
    id: `goal-${row.id}`,
    name: row.name,
    targetAmount: row.target_amount,
    targetDate: row.target_date,
    walletId: `wallet-${row.wallet_id}`,
    monthlyContribution: row.monthly_contribution,
    archived: Boolean(row.archived),
  };
}

/**
 * Read model layar Rencana: item plan, realisasi per kategori, dan
 * seluruh angka snapshot diturunkan dari transaksi satu periode aktif
 * (ADR-0004) — tidak ada full scan tabel transaksi.
 */
export async function readPlanView(
  database: SQLiteDatabase,
  today = todayISO(),
): Promise<PlanRead> {
  const active = await ensureActiveBudgetPlan(database, today);
  const period = periodFromRow(active.period);
  const [
    incomeRows,
    expenseRows,
    legacyFixedRows,
    legacyAllocationRows,
    goalRows,
    transactions,
    wallets,
    categories,
  ] = await Promise.all([
    database.getAllAsync<ItemRow>(
      `SELECT i.id, i.budget_plan_id, i.name, i.category_id, i.target_amount,
                t.wallet_id
         FROM income_items i
         LEFT JOIN transactions t ON t.source_income_item_id = i.id
         WHERE i.budget_plan_id = ? ORDER BY i.id;`,
      active.planId,
    ),
    database.getAllAsync<ItemRow>(
      'SELECT id, budget_plan_id, name, category_id, target_amount, is_paid FROM expense_items WHERE budget_plan_id = ? ORDER BY id;',
      active.planId,
    ),
    database.getAllAsync<ItemRow>(
      'SELECT id, budget_plan_id, name, category_id, target_amount FROM fixed_expense_items WHERE budget_plan_id = ? ORDER BY id;',
      active.planId,
    ),
    database.getAllAsync<ItemRow>(
      'SELECT id, budget_plan_id, name, category_id, target_amount FROM allocation_items WHERE budget_plan_id = ? ORDER BY id;',
      active.planId,
    ),
    database.getAllAsync<GoalRow>(
      'SELECT id, name, target_amount, target_date, wallet_id, monthly_contribution, archived FROM goals WHERE archived = 0 ORDER BY id;',
    ),
    getDatabaseTransactionsBetween(database, period.startDate, period.endDate),
    getWallets(database, true),
    getDatabaseTransactionCategories(database),
  ]);
  const incomeItems = incomeRows.map((row) => toItem(row, 'income')) as IncomeItem[];
  const canonicalExpenseRows = (
    expenseRows.length ? expenseRows : [...legacyFixedRows, ...legacyAllocationRows]
  ).filter(
    (row, index, rows) =>
      rows.findIndex((candidate) => candidate.category_id === row.category_id) === index,
  );
  const expenseItems = canonicalExpenseRows.map((row) => toItem(row, 'expense')) as ExpenseItem[];
  const fixedExpenseItems = legacyFixedRows.map((row) =>
    toItem(row, 'fixedExpense'),
  ) as FixedExpenseItem[];
  const allocationItems = legacyAllocationRows.map((row) =>
    toItem(row, 'allocation'),
  ) as AllocationItem[];
  const goals = goalRows.map(toGoal);
  const periodTransactions = transactions.filter(
    (transaction) =>
      transaction.type === 'income' ||
      transaction.type === 'expense' ||
      transaction.type === 'transfer',
  );
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const addUnplannedTransactionCategories = (
    items: BudgetPlanItem[],
    transactionType: 'income' | 'expense',
    itemType: 'income' | 'expense',
  ): BudgetPlanItem[] => {
    const known = new Set(items.map((item) => item.categoryId));
    const categoryIds = new Set(
      periodTransactions
        .filter((transaction) => transaction.type === transactionType && transaction.categoryId)
        .map((transaction) => transaction.categoryId!),
    );
    return [
      ...items,
      ...[...categoryIds]
        .filter((categoryId) => !known.has(categoryId))
        .map((categoryId) => {
          const realizedAmount = realizedForCategory(
            periodTransactions,
            categoryId,
            transactionType,
          );
          return {
            id: `${itemType}-category-${categoryId.replace('category-', '')}`,
            type: itemType,
            name: categoryNames.get(categoryId) ?? i18n.t('common.uncategorized'),
            categoryId,
            targetAmount: itemType === 'expense' ? realizedAmount : 0,
            isAutomatic: true,
          } as BudgetPlanItem;
        }),
    ];
  };
  const visibleIncomeItems = addUnplannedTransactionCategories(
    incomeItems,
    'income',
    'income',
  ) as IncomeItem[];
  const visibleExpenseItems = addUnplannedTransactionCategories(
    expenseItems,
    'expense',
    'expense',
  ) as ExpenseItem[];
  const realizedFor = (categoryId: string, type: 'income' | 'expense') =>
    realizedForCategory(periodTransactions, categoryId, type);
  const itemStates = (items: BudgetPlanItem[], type: 'income' | 'expense') =>
    items.map((item) => {
      const realizedAmount = realizedFor(item.categoryId, type);
      const { progressPercent, overBudget } =
        type === 'income'
          ? { progressPercent: 100, overBudget: false }
          : expenseProgress(realizedAmount, item.targetAmount);
      return {
        itemId: item.id,
        realizedAmount,
        progressPercent,
        overBudget,
      } satisfies PlanItemState;
    });
  const planItems = [
    ...itemStates(visibleIncomeItems, 'income'),
    ...itemStates(visibleExpenseItems, 'expense'),
  ];
  const totals = summarizeLedger(periodTransactions);
  const goalBalances = new Map(
    goals.map((goal) => [
      goal.walletId,
      wallets.find((wallet) => wallet.id === goal.walletId)?.balance ?? 0,
    ]),
  );
  const goalBalance = [...goalBalances.values()].reduce((sum, amount) => sum + amount, 0);
  const availableBalance = walletTotal(wallets);
  const plannedExpense = visibleExpenseItems.reduce((sum, item) => sum + item.targetAmount, 0);
  const snapshot: BudgetSnapshot = {
    totalIncome: totals.income,
    totalExpense: totals.expense,
    totalTransferIn: totals.transferIn,
    totalTransferOut: totals.transferOut,
    netSaving: netSaving(totals),
    spareBudget: totals.income - plannedExpense,
    availableBalance,
    freeBalance: availableBalance - goalBalance,
    goalBalance,
    planItems,
  };
  const plan: BudgetPlan = {
    id: `plan-${active.planId}`,
    budgetPeriodId: period.id,
    incomeItems: visibleIncomeItems,
    expenseItems: visibleExpenseItems,
    fixedExpenseItems,
    allocationItems,
    goalIds: goals.map((goal) => goal.id),
  };
  return {
    planView: { snapshot, plan, goals, wallets, period, startDay: active.startDay },
    categories,
  };
}
