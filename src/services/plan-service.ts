import type { SQLiteDatabase } from 'expo-sqlite';

import mockData from '@/data/mock-data';
import { getDatabaseTransactions } from '@/services/transaction-service';
import { getWallets } from '@/services/wallet-service';
import type { BudgetPlan, BudgetPlanItem, BudgetPeriod, FixedExpenseItem, Goal, IncomeItem, AllocationItem, MockBudgetSnapshot, MockPlanItemState, PlanItemType } from '@/types/domain';

export type PlanItemDraft = { type: PlanItemType; name: string; categoryId: string; targetAmount: number };

export function getPlanView() {
  const snapshot = mockData.budgetSnapshot;
  const plan = mockData.budgetPlans[0];
  return { snapshot, plan, goals: mockData.goals.filter((goal) => !goal.archived), wallets: mockData.wallets, period: mockData.budgetPeriods[0] };
}

export function getPlanItemState(itemId: string) {
  return mockData.budgetSnapshot.planItems.find((item) => item.itemId === itemId);
}

export function getPaymentLabel(kind: string, paidAmount?: number, targetAmount?: number) {
  if (kind === 'Lunas') return 'Lunas ✓';
  if (kind === 'Sebagian dibayar') return `${paidAmount ?? 0}/${targetAmount ?? 0} dibayar`;
  return 'Belum dibayar';
}

type PeriodRow = { id: number; start_date: string; end_date: string; duration_months: number };
type GoalRow = { id: number; name: string; target_amount: number; target_date: string | null; wallet_id: number; monthly_contribution: number; archived: number };
type ItemRow = { id: number; budget_plan_id: number; name: string; category_id: number; target_amount: number };

function dateOnly(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addMonths(date: string, months: number) {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1 + months, day, 12));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}

function periodBounds(startDay: number, today = dateOnly()) {
  const safeDay = Math.min(Math.max(Math.trunc(startDay), 1), 28);
  let start = `${today.slice(0, 7)}-${String(safeDay).padStart(2, '0')}`;
  if (today < start) start = addMonths(start, -1);
  const nextStart = addMonths(start, 1);
  const [year, month, day] = nextStart.split('-').map(Number);
  const end = new Date(Date.UTC(year, month - 1, day - 1, 12));
  return { startDate: start, endDate: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}` };
}

function toPeriod(row: PeriodRow): BudgetPeriod {
  return { id: `period-${row.id}`, startDate: row.start_date, endDate: row.end_date, durationMonths: 1 };
}

function toItem(row: ItemRow, type: BudgetPlanItem['type']): BudgetPlanItem {
  const common = { id: `${type === 'fixedExpense' ? 'fixed-expense' : type}-item-${row.id}`, name: row.name, categoryId: `category-${row.category_id}`, targetAmount: row.target_amount };
  if (type === 'income') return { ...common, type: 'income' } satisfies IncomeItem;
  if (type === 'fixedExpense') return { ...common, type: 'fixedExpense' } satisfies FixedExpenseItem;
  return { ...common, type: 'allocation' } satisfies AllocationItem;
}

function toGoal(row: GoalRow): Goal {
  return { id: `goal-${row.id}`, name: row.name, targetAmount: row.target_amount, targetDate: row.target_date, walletId: `wallet-${row.wallet_id}`, monthlyContribution: row.monthly_contribution, archived: Boolean(row.archived) };
}

function databaseId(value: string | number) {
  const id = typeof value === 'number' ? value : Number(String(value).replace(/^category-/, '').replace(/^(?:income|fixed-expense|allocation)-item-/, ''));
  if (!Number.isInteger(id) || id < 1) throw new Error(`ID plan tidak valid: ${value}`);
  return id;
}

function tableFor(type: PlanItemType) {
  if (type === 'income') return 'income_items';
  if (type === 'fixedExpense') return 'fixed_expense_items';
  return 'allocation_items';
}

function categoryTypeFor(type: PlanItemType) {
  return type === 'income' ? 'income' : 'expense';
}

function validatePlanItem(draft: PlanItemDraft) {
  if (!draft.name.trim()) throw new Error('Nama item plan wajib diisi');
  if (!Number.isSafeInteger(draft.targetAmount) || draft.targetAmount <= 0) throw new Error('Nominal item plan harus berupa angka bulat positif');
  databaseId(draft.categoryId);
}

export async function createDatabasePlanItem(database: SQLiteDatabase, draft: PlanItemDraft): Promise<void> {
  validatePlanItem(draft);
  const active = await ensureActiveBudgetPlan(database);
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const category = await transaction.getFirstAsync<{ id: number }>('SELECT id FROM categories WHERE id = ? AND type = ? AND archived = 0 LIMIT 1;', databaseId(draft.categoryId), categoryTypeFor(draft.type));
    if (!category) throw new Error('Kategori item plan tidak sesuai atau sudah diarsipkan');
    await transaction.runAsync(`INSERT INTO ${tableFor(draft.type)} (budget_plan_id, name, category_id, target_amount) VALUES (?, ?, ?, ?);`, active.planId, draft.name.trim(), category.id, draft.targetAmount);
  });
}

export async function updateDatabasePlanItem(database: SQLiteDatabase, item: BudgetPlanItem, draft: PlanItemDraft): Promise<void> {
  validatePlanItem(draft);
  if (item.type !== draft.type) throw new Error('Tipe item plan tidak dapat diubah');
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const category = await transaction.getFirstAsync<{ id: number }>('SELECT id FROM categories WHERE id = ? AND type = ? AND archived = 0 LIMIT 1;', databaseId(draft.categoryId), categoryTypeFor(draft.type));
    if (!category) throw new Error('Kategori item plan tidak sesuai atau sudah diarsipkan');
    const result = await transaction.runAsync(`UPDATE ${tableFor(item.type)} SET name = ?, category_id = ?, target_amount = ? WHERE id = ?;`, draft.name.trim(), category.id, draft.targetAmount, databaseId(item.id));
    if (result.changes === 0) throw new Error('Item plan tidak ditemukan');
  });
}

export async function deleteDatabasePlanItem(database: SQLiteDatabase, item: BudgetPlanItem): Promise<void> {
  const result = await database.runAsync(`DELETE FROM ${tableFor(item.type)} WHERE id = ?;`, databaseId(item.id));
  if (result.changes === 0) throw new Error('Item plan tidak ditemukan');
}

export async function ensureActiveBudgetPlan(database: SQLiteDatabase, today = dateOnly()) {
  let planId = 0;
  let periodId = 0;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const setting = await transaction.getFirstAsync<{ budget_start_day: number }>('SELECT budget_start_day FROM settings WHERE id = 1 LIMIT 1;');
    const bounds = periodBounds(setting?.budget_start_day ?? 1, today);
    const configuredPeriod = await transaction.getFirstAsync<PeriodRow>('SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE start_date = ? LIMIT 1;', bounds.startDate);
    const configuredPlan = configuredPeriod && await transaction.getFirstAsync<{ id: number }>('SELECT id FROM budget_plans WHERE budget_period_id = ? LIMIT 1;', configuredPeriod.id);
    if (configuredPeriod && configuredPlan) {
      periodId = configuredPeriod.id;
      planId = configuredPlan.id;
      return;
    }
    const existingPeriod = await transaction.getFirstAsync<PeriodRow>('SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE start_date = ? LIMIT 1;', bounds.startDate);
    periodId = existingPeriod?.id ?? (await transaction.runAsync(
      `INSERT INTO budget_periods (start_date, end_date, duration_months) VALUES (?, ?, 1);`,
      bounds.startDate,
      bounds.endDate,
    )).lastInsertRowId;
    const existingPlan = await transaction.getFirstAsync<{ id: number }>('SELECT id FROM budget_plans WHERE budget_period_id = ? LIMIT 1;', periodId);
    planId = existingPlan?.id ?? (await transaction.runAsync('INSERT INTO budget_plans (budget_period_id) VALUES (?);', periodId)).lastInsertRowId;
  });
  const period = await database.getFirstAsync<PeriodRow>('SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE id = ?;', periodId);
  if (!period) throw new Error('Budget period gagal dibuat');
  return { period, planId };
}

export async function setBudgetPeriodStartDay(database: SQLiteDatabase, startDay: number, today = dateOnly()) {
  const bounds = periodBounds(startDay, today);
  let periodId = 0;
  let planId = 0;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const safeStartDay = Math.min(Math.max(Math.trunc(startDay), 1), 28);
    await transaction.runAsync('INSERT OR IGNORE INTO settings (id, currency, theme_mode, budget_start_day) VALUES (1, \'IDR\', \'system\', ?);', safeStartDay);
    await transaction.runAsync('UPDATE settings SET budget_start_day = ? WHERE id = 1;', safeStartDay);
    const existing = await transaction.getFirstAsync<PeriodRow>('SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE start_date = ? LIMIT 1;', bounds.startDate);
    periodId = existing?.id ?? (await transaction.runAsync(
      `INSERT INTO budget_periods (start_date, end_date, duration_months) VALUES (?, ?, 1);`,
      bounds.startDate,
      bounds.endDate,
    )).lastInsertRowId;
    const existingPlan = await transaction.getFirstAsync<{ id: number }>('SELECT id FROM budget_plans WHERE budget_period_id = ? LIMIT 1;', periodId);
    planId = existingPlan?.id ?? (await transaction.runAsync('INSERT INTO budget_plans (budget_period_id) VALUES (?);', periodId)).lastInsertRowId;
  });
  return { period: await database.getFirstAsync<PeriodRow>('SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE id = ?;', periodId), planId };
}

export async function getDatabasePlanView(database: SQLiteDatabase, today = dateOnly()) {
  const active = await ensureActiveBudgetPlan(database, today);
  const period = toPeriod(active.period);
  const [incomeRows, fixedRows, allocationRows, goalRows, transactions, wallets] = await Promise.all([
    database.getAllAsync<ItemRow>('SELECT id, budget_plan_id, name, category_id, target_amount FROM income_items WHERE budget_plan_id = ? ORDER BY id;', active.planId),
    database.getAllAsync<ItemRow>('SELECT id, budget_plan_id, name, category_id, target_amount FROM fixed_expense_items WHERE budget_plan_id = ? ORDER BY id;', active.planId),
    database.getAllAsync<ItemRow>('SELECT id, budget_plan_id, name, category_id, target_amount FROM allocation_items WHERE budget_plan_id = ? ORDER BY id;', active.planId),
    database.getAllAsync<GoalRow>('SELECT id, name, target_amount, target_date, wallet_id, monthly_contribution, archived FROM goals WHERE archived = 0 ORDER BY id;'),
    getDatabaseTransactions(database),
    getWallets(database, true),
  ]);
  const incomeItems = incomeRows.map((row) => toItem(row, 'income')) as IncomeItem[];
  const fixedExpenseItems = fixedRows.map((row) => toItem(row, 'fixedExpense')) as FixedExpenseItem[];
  const allocationItems = allocationRows.map((row) => toItem(row, 'allocation')) as AllocationItem[];
  const goals = goalRows.map(toGoal);
  const periodTransactions = transactions.filter((transaction) => transaction.date >= period.startDate && transaction.date <= period.endDate);
  const realizedFor = (categoryId: string, type: 'income' | 'expense') => periodTransactions.reduce((sum, transaction) => sum + (transaction.type === type && transaction.categoryId === categoryId ? transaction.amount : 0), 0);
  const itemStates = (items: BudgetPlanItem[], type: 'income' | 'expense') => items.map((item) => {
    const realizedAmount = realizedFor(item.categoryId, type);
    const progressPercent = item.targetAmount ? realizedAmount / item.targetAmount * 100 : 0;
    const paymentStatus = item.type === 'fixedExpense' ? realizedAmount >= item.targetAmount ? { kind: 'Lunas' as const } : realizedAmount > 0 ? { kind: 'Sebagian dibayar' as const, paidAmount: realizedAmount, targetAmount: item.targetAmount } : { kind: 'Belum dibayar' as const } : undefined;
    return { itemId: item.id, realizedAmount, progressPercent, paymentStatus, overBudget: item.type !== 'income' && realizedAmount > item.targetAmount } satisfies MockPlanItemState;
  });
  const planItems = [...itemStates(incomeItems, 'income'), ...itemStates(fixedExpenseItems, 'expense'), ...itemStates(allocationItems, 'expense')];
  const totalIncomeTarget = incomeItems.reduce((sum, item) => sum + item.targetAmount, 0);
  const totalIncome = periodTransactions.reduce((sum, transaction) => sum + (transaction.type === 'income' ? transaction.amount : 0), 0);
  const totalExpense = periodTransactions.reduce((sum, transaction) => sum + (transaction.type === 'expense' ? transaction.amount : 0), 0);
  const totalTransferIn = periodTransactions.reduce((sum, transaction) => sum + (transaction.type === 'transfer' && transaction.toWalletId ? transaction.amount : 0), 0);
  const totalTransferOut = periodTransactions.reduce((sum, transaction) => sum + (transaction.type === 'transfer' && transaction.walletId ? transaction.amount : 0), 0);
  const goalBalances = new Map(goals.map((goal) => [goal.walletId, wallets.find((wallet) => wallet.id === goal.walletId)?.balance ?? 0]));
  const goalBalance = [...goalBalances.values()].reduce((sum, amount) => sum + amount, 0);
  const activeGoalContribution = goals.reduce((sum, goal) => (goalBalances.get(goal.walletId) ?? 0) >= goal.targetAmount ? sum : sum + goal.monthlyContribution, 0);
  const availableBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const snapshot: MockBudgetSnapshot = { totalIncome, totalExpense, totalTransferIn, totalTransferOut, netSaving: totalIncome - totalExpense + totalTransferIn - totalTransferOut, spareBudget: totalIncomeTarget - fixedExpenseItems.reduce((sum, item) => sum + item.targetAmount, 0) - activeGoalContribution, availableBalance, freeBalance: availableBalance - goalBalance, goalBalance, planItems };
  const plan: BudgetPlan = { id: `plan-${active.planId}`, budgetPeriodId: period.id, incomeItems, fixedExpenseItems, allocationItems, goalIds: goals.map((goal) => goal.id) };
  return { snapshot, plan, goals, wallets, period };
}
