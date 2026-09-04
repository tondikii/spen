import type { SQLiteDatabase } from 'expo-sqlite';

import mockData from '@/data/mock-data';
import { getDatabaseTransactions } from '@/services/transaction-service';
import { createWallet, getWallets } from '@/services/wallet-service';
import { createGoal } from '@/services/goal-service';
import type { BudgetSuggestion } from '@/services/ai-service';
import type {
  AllocationItem,
  BudgetPlan,
  BudgetPlanItem,
  BudgetPeriod,
  Category,
  FixedExpenseItem,
  Goal,
  IncomeItem,
  ExpenseItem,
  MockBudgetSnapshot,
  MockPlanItemState,
  PlanItemType,
  Wallet,
} from '@/types/domain';

export type PlanItemDraft = {
  type: PlanItemType;
  categoryId: string;
  targetAmount: number;
  name?: string;
};

export function getPlanView() {
  const snapshot = mockData.budgetSnapshot;
  const plan = mockData.budgetPlans[0];
  return {
    snapshot,
    plan,
    goals: mockData.goals.filter((goal) => !goal.archived),
    wallets: mockData.wallets,
    period: mockData.budgetPeriods[0],
  };
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
type GoalRow = {
  id: number;
  name: string;
  target_amount: number;
  target_date: string | null;
  wallet_id: number;
  monthly_contribution: number;
  archived: number;
};
type ItemRow = {
  id: number;
  budget_plan_id: number;
  name: string;
  category_id: number;
  target_amount: number;
  is_paid?: number;
};

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
  return {
    startDate: start,
    endDate: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`,
  };
}

function toPeriod(row: PeriodRow): BudgetPeriod {
  return {
    id: `period-${row.id}`,
    startDate: row.start_date,
    endDate: row.end_date,
    durationMonths: 1,
  };
}

function toItem(row: ItemRow, type: PlanItemType): BudgetPlanItem {
  const common = {
    id: `${type}-item-${row.id}`,
    name: row.name,
    categoryId: `category-${row.category_id}`,
    targetAmount: row.target_amount,
  };
  if (type === 'income') return { ...common, type: 'income' } satisfies IncomeItem;
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

function databaseId(value: string | number) {
  const id =
    typeof value === 'number'
      ? value
      : Number(
          String(value)
            .replace(/^category-/, '')
            .replace(/^(?:income|expense|fixed-expense|allocation)-item-/, ''),
        );
  if (!Number.isInteger(id) || id < 1) throw new Error(`ID plan tidak valid: ${value}`);
  return id;
}

function tableFor(type: PlanItemType) {
  if (type === 'income') return 'income_items';
  if (type === 'fixedExpense') return 'fixed_expense_items';
  if (type === 'allocation') return 'allocation_items';
  return 'expense_items';
}

function categoryTypeFor(type: PlanItemType) {
  return type === 'income' ? 'income' : 'expense';
}

function validatePlanItem(draft: PlanItemDraft) {
  if (
    !Number.isSafeInteger(draft.targetAmount) ||
    draft.targetAmount < 0 ||
    (draft.type === 'expense' && draft.targetAmount <= 0)
  )
    throw new Error('Nominal item plan harus berupa angka bulat positif');
  databaseId(draft.categoryId);
}

export async function createDatabasePlanItem(
  database: SQLiteDatabase,
  draft: PlanItemDraft,
): Promise<void> {
  validatePlanItem(draft);
  const active = await ensureActiveBudgetPlan(database);
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const category = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM categories WHERE id = ? AND type = ? AND archived = 0 LIMIT 1;',
      databaseId(draft.categoryId),
      categoryTypeFor(draft.type),
    );
    if (!category) throw new Error('Kategori item plan tidak sesuai atau sudah diarsipkan');
    const duplicate = await transaction.getFirstAsync<{ id: number }>(
      `SELECT id FROM ${tableFor(draft.type)} WHERE budget_plan_id = ? AND category_id = ? LIMIT 1;`,
      active.planId,
      category.id,
    );
    if (duplicate) throw new Error('Kategori itu sudah ada di Budget plan');
    const categoryName = await transaction.getFirstAsync<{ name: string }>(
      'SELECT name FROM categories WHERE id = ? LIMIT 1;',
      category.id,
    );
    await transaction.runAsync(
      `INSERT INTO ${tableFor(draft.type)} (budget_plan_id, name, category_id, target_amount${draft.type === 'expense' ? ', is_paid' : ''}) VALUES (?, ?, ?, ?${draft.type === 'expense' ? ', 0' : ''});`,
      active.planId,
      categoryName?.name ?? 'Tanpa kategori',
      category.id,
      draft.targetAmount,
    );
  });
}

export async function updateDatabasePlanItem(
  database: SQLiteDatabase,
  item: BudgetPlanItem,
  draft: PlanItemDraft,
): Promise<void> {
  validatePlanItem(draft);
  if (item.type !== draft.type) throw new Error('Tipe item plan tidak dapat diubah');
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const category = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM categories WHERE id = ? AND type = ? AND archived = 0 LIMIT 1;',
      databaseId(draft.categoryId),
      categoryTypeFor(draft.type),
    );
    if (!category) throw new Error('Kategori item plan tidak sesuai atau sudah diarsipkan');
    const duplicate = await transaction.getFirstAsync<{ id: number }>(
      `SELECT id FROM ${tableFor(item.type)} WHERE budget_plan_id = (SELECT budget_plan_id FROM ${tableFor(item.type)} WHERE id = ? LIMIT 1) AND category_id = ? AND id <> ? LIMIT 1;`,
      databaseId(item.id),
      category.id,
      databaseId(item.id),
    );
    if (duplicate) throw new Error('Kategori itu sudah ada di Budget plan');
    const categoryName = await transaction.getFirstAsync<{ name: string }>(
      'SELECT name FROM categories WHERE id = ? LIMIT 1;',
      category.id,
    );
    const result = await transaction.runAsync(
      `UPDATE ${tableFor(item.type)} SET name = ?, category_id = ?, target_amount = ? WHERE id = ?;`,
      categoryName?.name ?? 'Tanpa kategori',
      category.id,
      draft.targetAmount,
      databaseId(item.id),
    );
    if (result.changes === 0) throw new Error('Item plan tidak ditemukan');
  });
}

export async function deleteDatabasePlanItem(
  database: SQLiteDatabase,
  item: BudgetPlanItem,
): Promise<void> {
  const result = await database.runAsync(
    `DELETE FROM ${tableFor(item.type)} WHERE id = ?;`,
    databaseId(item.id),
  );
  if (result.changes === 0) throw new Error('Item plan tidak ditemukan');
}

export async function setDatabasePlanItemPaid(
  database: SQLiteDatabase,
  item: BudgetPlanItem,
  paid: boolean,
  walletId: string,
  today = dateOnly(),
): Promise<void> {
  if (item.type !== 'expense' || item.isAutomatic)
    throw new Error('Pengeluaran otomatis belum memiliki target pembayaran manual');
  const numericWalletId = Number(walletId.replace(/^wallet-/, ''));
  if (!Number.isInteger(numericWalletId) || numericWalletId < 1)
    throw new Error('Wallet pembayaran tidak valid');
  const numericItemId = databaseId(item.id);
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const wallet = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM wallets WHERE id = ? AND archived = 0 LIMIT 1;',
      numericWalletId,
    );
    if (!wallet) throw new Error('Belum ada Wallet aktif untuk pembayaran');
    const current = await transaction.getFirstAsync<{
      category_id: number;
      target_amount: number;
      is_paid: number;
    }>(
      'SELECT category_id, target_amount, is_paid FROM expense_items WHERE id = ? LIMIT 1;',
      numericItemId,
    );
    if (!current) throw new Error('Item Pengeluaran tidak ditemukan');
    const note = `Pembayaran Plan: ${item.name}`;
    if (paid && !current.is_paid) {
      const now = new Date();
      await transaction.runAsync(
        `INSERT INTO transactions (type, wallet_id, category_id, amount, date, time, note, is_initial) VALUES ('expense', ?, ?, ?, ?, ?, ?, 0);`,
        numericWalletId,
        current.category_id,
        current.target_amount,
        today,
        now.toTimeString().slice(0, 5),
        note,
      );
    } else if (!paid && current.is_paid) {
      await transaction.runAsync(
        "DELETE FROM transactions WHERE id = (SELECT id FROM transactions WHERE type = 'expense' AND wallet_id = ? AND category_id = ? AND amount = ? AND date = ? AND note = ? ORDER BY id DESC LIMIT 1);",
        numericWalletId,
        current.category_id,
        current.target_amount,
        today,
        note,
      );
    }
    await transaction.runAsync(
      'UPDATE expense_items SET is_paid = ? WHERE id = ?;',
      paid ? 1 : 0,
      numericItemId,
    );
  });
}

export type BudgetSuggestionContext = {
  categories: Category[];
  plan: Pick<BudgetPlan, 'expenseItems'>;
  goals: Goal[];
  wallets: Wallet[];
};

export async function applyDatabaseBudgetSuggestion(
  database: SQLiteDatabase,
  suggestion: BudgetSuggestion,
  context: BudgetSuggestionContext,
): Promise<void> {
  if (suggestion.action === 'review_expense') return;
  if (suggestion.action === 'add_goal') {
    const targetAmount = suggestion.targetAmount ?? suggestion.amount;
    if (
      typeof targetAmount !== 'number' ||
      !Number.isSafeInteger(targetAmount) ||
      targetAmount <= 0
    )
      throw new Error('Saran Goal belum memiliki target nominal yang valid.');
    const existingGoalWalletIds = new Set(context.goals.map((goal) => goal.walletId));
    const requestedWalletName = suggestion.walletName?.trim().toLowerCase();
    let wallet = context.wallets.find(
      (candidate) =>
        !candidate.archived &&
        !existingGoalWalletIds.has(candidate.id) &&
        requestedWalletName &&
        candidate.name.toLowerCase() === requestedWalletName,
    );
    if (!wallet)
      wallet = context.wallets.find(
        (candidate) => !candidate.archived && !existingGoalWalletIds.has(candidate.id),
      );
    if (!wallet)
      wallet = await createWallet(
        database,
        suggestion.walletName?.trim() || `${suggestion.title.trim()} Wallet`,
        0,
      );
    const monthlyContribution = suggestion.monthlyContribution ?? 0;
    if (!Number.isSafeInteger(monthlyContribution) || monthlyContribution < 0)
      throw new Error('Saran Goal memiliki kontribusi bulanan yang tidak valid.');
    await createGoal(database, {
      name: suggestion.title.trim(),
      targetAmount,
      targetDate: null,
      walletId: wallet.id,
      monthlyContribution,
    });
    return;
  }
  const category =
    context.categories.find(
      (item) =>
        item.type === 'expense' &&
        !item.archived &&
        item.name.toLowerCase() === suggestion.categoryName?.toLowerCase(),
    ) ??
    context.categories.find(
      (item) => item.type === 'expense' && !item.archived && item.name === 'Belanja',
    );
  if (
    !category ||
    typeof suggestion.amount !== 'number' ||
    !Number.isSafeInteger(suggestion.amount) ||
    suggestion.amount <= 0
  )
    throw new Error('Saran belum memiliki kategori atau nominal yang bisa diterapkan.');
  if (suggestion.action === 'increase_allocation') {
    const existing = context.plan.expenseItems.find((item) => item.categoryId === category.id);
    if (existing)
      await updateDatabasePlanItem(database, existing, {
        type: 'expense',
        name: existing.name,
        categoryId: category.id,
        targetAmount: existing.targetAmount + suggestion.amount,
      });
    else
      await createDatabasePlanItem(database, {
        type: 'expense',
        name: `Pengeluaran ${category.name}`,
        categoryId: category.id,
        targetAmount: suggestion.amount,
      });
  } else {
    await createDatabasePlanItem(database, {
      type: 'expense',
      name: `Pengeluaran ${category.name}`,
      categoryId: category.id,
      targetAmount: suggestion.amount,
    });
  }
}

export async function ensureActiveBudgetPlan(database: SQLiteDatabase, today = dateOnly()) {
  let planId = 0;
  let periodId = 0;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const setting = await transaction.getFirstAsync<{ budget_start_day: number }>(
      'SELECT budget_start_day FROM settings WHERE id = 1 LIMIT 1;',
    );
    const bounds = periodBounds(setting?.budget_start_day ?? 1, today);
    const configuredPeriod = await transaction.getFirstAsync<PeriodRow>(
      'SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE start_date = ? LIMIT 1;',
      bounds.startDate,
    );
    const configuredPlan =
      configuredPeriod &&
      (await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM budget_plans WHERE budget_period_id = ? LIMIT 1;',
        configuredPeriod.id,
      ));
    if (configuredPeriod && configuredPlan) {
      periodId = configuredPeriod.id;
      planId = configuredPlan.id;
      return;
    }
    const existingPeriod = await transaction.getFirstAsync<PeriodRow>(
      'SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE start_date = ? LIMIT 1;',
      bounds.startDate,
    );
    periodId =
      existingPeriod?.id ??
      (
        await transaction.runAsync(
          `INSERT INTO budget_periods (start_date, end_date, duration_months) VALUES (?, ?, 1);`,
          bounds.startDate,
          bounds.endDate,
        )
      ).lastInsertRowId;
    const existingPlan = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM budget_plans WHERE budget_period_id = ? LIMIT 1;',
      periodId,
    );
    planId =
      existingPlan?.id ??
      (
        await transaction.runAsync(
          'INSERT INTO budget_plans (budget_period_id) VALUES (?);',
          periodId,
        )
      ).lastInsertRowId;
  });
  const period = await database.getFirstAsync<PeriodRow>(
    'SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE id = ?;',
    periodId,
  );
  if (!period) throw new Error('Budget period gagal dibuat');
  return { period, planId };
}

export async function setBudgetPeriodStartDay(
  database: SQLiteDatabase,
  startDay: number,
  today = dateOnly(),
) {
  const bounds = periodBounds(startDay, today);
  let periodId = 0;
  let planId = 0;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const safeStartDay = Math.min(Math.max(Math.trunc(startDay), 1), 28);
    await transaction.runAsync(
      "INSERT OR IGNORE INTO settings (id, currency, theme_mode, budget_start_day) VALUES (1, 'IDR', 'light', ?);",
      safeStartDay,
    );
    await transaction.runAsync(
      'UPDATE settings SET budget_start_day = ? WHERE id = 1;',
      safeStartDay,
    );
    const existing = await transaction.getFirstAsync<PeriodRow>(
      'SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE start_date = ? LIMIT 1;',
      bounds.startDate,
    );
    periodId =
      existing?.id ??
      (
        await transaction.runAsync(
          `INSERT INTO budget_periods (start_date, end_date, duration_months) VALUES (?, ?, 1);`,
          bounds.startDate,
          bounds.endDate,
        )
      ).lastInsertRowId;
    const existingPlan = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM budget_plans WHERE budget_period_id = ? LIMIT 1;',
      periodId,
    );
    planId =
      existingPlan?.id ??
      (
        await transaction.runAsync(
          'INSERT INTO budget_plans (budget_period_id) VALUES (?);',
          periodId,
        )
      ).lastInsertRowId;
  });
  return {
    period: await database.getFirstAsync<PeriodRow>(
      'SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE id = ?;',
      periodId,
    ),
    planId,
  };
}

export async function getDatabasePlanView(database: SQLiteDatabase, today = dateOnly()) {
  const active = await ensureActiveBudgetPlan(database, today);
  const period = toPeriod(active.period);
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
      'SELECT id, budget_plan_id, name, category_id, target_amount FROM income_items WHERE budget_plan_id = ? ORDER BY id;',
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
    getDatabaseTransactions(database),
    getWallets(database, true),
    database.getAllAsync<{ id: number; name: string }>(
      'SELECT id, name FROM categories ORDER BY id;',
    ),
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
      transaction.date >= period.startDate &&
      transaction.date <= period.endDate &&
      (transaction.type === 'income' ||
        transaction.type === 'expense' ||
        transaction.type === 'transfer'),
  );
  const categoryNames = new Map(
    categories.map((category) => [`category-${category.id}`, category.name]),
  );
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
          const realizedAmount = realizedForCategory(categoryId, transactionType);
          return {
            id: `${itemType}-category-${categoryId.replace('category-', '')}`,
            type: itemType,
            name: categoryNames.get(categoryId) ?? 'Tanpa kategori',
            categoryId,
            targetAmount: itemType === 'expense' ? realizedAmount : 0,
            isAutomatic: true,
          } as BudgetPlanItem;
        }),
    ];
  };
  const realizedForCategory = (categoryId: string, type: 'income' | 'expense') =>
    periodTransactions.reduce(
      (sum, transaction) =>
        sum +
        (transaction.type === type && transaction.categoryId === categoryId
          ? transaction.amount
          : 0),
      0,
    );
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
    periodTransactions.reduce(
      (sum, transaction) =>
        sum +
        (transaction.type === type && transaction.categoryId === categoryId
          ? transaction.amount
          : 0),
      0,
    );
  const itemStates = (items: BudgetPlanItem[], type: 'income' | 'expense') =>
    items.map((item) => {
      const realizedAmount = realizedFor(item.categoryId, type);
      const progressPercent =
        type === 'expense' && item.targetAmount > 0
          ? (realizedAmount / item.targetAmount) * 100
          : 0;
      return {
        itemId: item.id,
        realizedAmount,
        progressPercent,
        overBudget:
          type === 'expense' && item.targetAmount > 0 && realizedAmount > item.targetAmount,
      } satisfies MockPlanItemState;
    });
  const planItems = [
    ...itemStates(visibleIncomeItems, 'income'),
    ...itemStates(visibleExpenseItems, 'expense'),
  ];
  const totalIncome = periodTransactions.reduce(
    (sum, transaction) => sum + (transaction.type === 'income' ? transaction.amount : 0),
    0,
  );
  const totalExpense = periodTransactions.reduce(
    (sum, transaction) => sum + (transaction.type === 'expense' ? transaction.amount : 0),
    0,
  );
  const totalTransferIn = periodTransactions.reduce(
    (sum, transaction) =>
      sum + (transaction.type === 'transfer' && transaction.toWalletId ? transaction.amount : 0),
    0,
  );
  const totalTransferOut = periodTransactions.reduce(
    (sum, transaction) =>
      sum +
      (transaction.type === 'transfer' && transaction.walletId
        ? transaction.amount + (transaction.adminFee ?? 0)
        : 0),
    0,
  );
  const goalBalances = new Map(
    goals.map((goal) => [
      goal.walletId,
      wallets.find((wallet) => wallet.id === goal.walletId)?.balance ?? 0,
    ]),
  );
  const goalBalance = [...goalBalances.values()].reduce((sum, amount) => sum + amount, 0);
  const activeGoalContribution = goals.reduce(
    (sum, goal) =>
      (goalBalances.get(goal.walletId) ?? 0) >= goal.targetAmount
        ? sum
        : sum + goal.monthlyContribution,
    0,
  );
  const availableBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const snapshot: MockBudgetSnapshot = {
    totalIncome,
    totalExpense,
    totalTransferIn,
    totalTransferOut,
    netSaving: totalIncome - totalExpense + totalTransferIn - totalTransferOut,
    spareBudget:
      totalIncome -
      expenseItems.reduce((sum, item) => sum + item.targetAmount, 0) -
      activeGoalContribution,
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
  return { snapshot, plan, goals, wallets, period };
}
