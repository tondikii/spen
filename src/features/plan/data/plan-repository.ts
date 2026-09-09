import type { SQLiteDatabase } from 'expo-sqlite';

import i18n from '@/i18n';
import { AppError } from '@/utils/app-error';
import { todayISO, isValidTransactionDate } from '@/utils/date';
import { periodBounds } from '@/utils/domain/period';
import { createWallet } from '@/features/wallet';
import { createGoal } from '@/features/goal';
import { SYSTEM_CATEGORY_NAMES } from '@/utils/domain/constants';
import type { BudgetSuggestion } from '@/lib/ai-service';
import type { BudgetPlan, BudgetPlanItem } from '../model';
import type { Category, Goal, Wallet } from '@/types/domain';
import type { PeriodRow } from '@/types/db-rows';
import { validatePlanItem, type PlanItemDraft } from './plan-item-draft';
import { categoryTypeFor, databaseId, tableFor } from './plan-item-mapping';
import { updateDatabasePlanItem } from './plan-item-mutations';

// Definisi yang dipindah ke sibling data, tetap diekspor dari sini agar API
// publik file ini (via src/features/plan/index.ts) tidak berubah.
export { setDatabasePlanItemPaid, updateDatabasePlanItem } from './plan-item-mutations';
export type { PlanItemDraft } from './plan-item-draft';

export async function createDatabasePlanItem(
  database: SQLiteDatabase,
  draft: PlanItemDraft,
): Promise<void> {
  validatePlanItem(draft);
  const active = await ensureActiveBudgetPlan(database);
  const transactionDate = draft.date ?? todayISO();
  if (
    !isValidTransactionDate(transactionDate) ||
    transactionDate < active.period.start_date ||
    transactionDate > todayISO()
  )
    throw new AppError('validation', undefined, 'Tanggal transaksi harus berada di Periode aktif');
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const category = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM categories WHERE id = ? AND type = ? AND archived = 0 LIMIT 1;',
      databaseId(draft.categoryId),
      categoryTypeFor(draft.type),
    );
    if (!category)
      throw new AppError(
        'notFound',
        undefined,
        'Kategori item plan tidak sesuai atau sudah diarsipkan',
      );
    const duplicate = await transaction.getFirstAsync<{ id: number }>(
      `SELECT id FROM ${tableFor(draft.type)} WHERE budget_plan_id = ? AND category_id = ? LIMIT 1;`,
      active.planId,
      category.id,
    );
    if (duplicate)
      throw new AppError('validation', undefined, 'Kategori itu sudah ada di Rencana Anggaran');
    const categoryName = await transaction.getFirstAsync<{ name: string }>(
      'SELECT name FROM categories WHERE id = ? LIMIT 1;',
      category.id,
    );
    const itemResult = await transaction.runAsync(
      `INSERT INTO ${tableFor(draft.type)} (budget_plan_id, name, category_id, target_amount${draft.type === 'expense' ? ', is_paid' : ''}) VALUES (?, ?, ?, ?${draft.type === 'expense' ? ', 0' : ''});`,
      active.planId,
      categoryName?.name ?? i18n.t('common.uncategorized'),
      category.id,
      draft.targetAmount,
    );
    if (draft.type === 'income') {
      const wallet = await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM wallets WHERE id = ? AND archived = 0 LIMIT 1;',
        databaseId(draft.walletId!),
      );
      if (!wallet)
        throw new AppError(
          'notFound',
          undefined,
          'Dompet Pendapatan tidak ditemukan atau sudah diarsipkan',
        );
      await transaction.runAsync(
        `INSERT INTO transactions (type, wallet_id, to_wallet_id, category_id, amount, date, time, note, admin_fee, source_income_item_id)
         VALUES ('income', ?, NULL, ?, ?, ?, '', ?, 0, ?);`,
        wallet.id,
        category.id,
        draft.targetAmount,
        transactionDate,
        i18n.t('common.planIncomeNote', {
          name: categoryName?.name ?? i18n.t('common.uncategorized'),
        }),
        itemResult.lastInsertRowId,
      );
    }
  });
}

export async function deleteDatabasePlanItem(
  database: SQLiteDatabase,
  item: BudgetPlanItem,
  today = todayISO(),
): Promise<void> {
  if (item.isAutomatic && (item.type === 'income' || item.type === 'expense')) {
    const active = await ensureActiveBudgetPlan(database, today);
    const categoryId = databaseId(item.categoryId);
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const result = await transaction.runAsync(
        'DELETE FROM transactions WHERE type = ? AND category_id = ? AND date BETWEEN ? AND ?;',
        item.type,
        categoryId,
        active.period.start_date,
        active.period.end_date,
      );
      if (result.changes === 0)
        throw new AppError('notFound', undefined, 'Transaksi item plan tidak ditemukan');
    });
    return;
  }

  const itemId = databaseId(item.id);
  await database.withExclusiveTransactionAsync(async (transaction) => {
    if (item.type === 'income') {
      await transaction.runAsync(
        'DELETE FROM transactions WHERE source_income_item_id = ?;',
        itemId,
      );
    }
    const result = await transaction.runAsync(
      `DELETE FROM ${tableFor(item.type)} WHERE id = ?;`,
      itemId,
    );
    if (result.changes === 0)
      throw new AppError('notFound', undefined, 'Item plan tidak ditemukan');
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
      throw new AppError(
        'validation',
        undefined,
        'Saran Goal belum memiliki target nominal yang valid.',
      );
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
      throw new AppError(
        'validation',
        undefined,
        'Saran Goal memiliki kontribusi bulanan yang tidak valid.',
      );
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
      (item) =>
        item.type === 'expense' &&
        !item.archived &&
        item.name === SYSTEM_CATEGORY_NAMES.fallbackExpense,
    );
  if (
    !category ||
    typeof suggestion.amount !== 'number' ||
    !Number.isSafeInteger(suggestion.amount) ||
    suggestion.amount <= 0
  )
    throw new AppError(
      'validation',
      undefined,
      'Saran belum memiliki kategori atau nominal yang bisa diterapkan.',
    );
  if (suggestion.action === 'increase_allocation') {
    const existing = context.plan.expenseItems.find(
      (item: BudgetPlanItem) => item.categoryId === category.id,
    );
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

export async function ensureActiveBudgetPlan(database: SQLiteDatabase, today = todayISO()) {
  let planId = 0;
  let periodId = 0;
  let startDay = 1;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const setting = await transaction.getFirstAsync<{ budget_start_day: number }>(
      'SELECT budget_start_day FROM settings WHERE id = 1 LIMIT 1;',
    );
    const bounds = periodBounds(setting?.budget_start_day ?? 1, today);
    startDay = setting?.budget_start_day ?? 1;
    const configuredPeriod = await transaction.getFirstAsync<PeriodRow>(
      'SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE start_date = ? AND end_date = ? LIMIT 1;',
      bounds.startDate,
      bounds.endDate,
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
      'SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE start_date = ? AND end_date = ? LIMIT 1;',
      bounds.startDate,
      bounds.endDate,
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
  if (!period) throw new AppError('storage', undefined, 'Budget period gagal dibuat');
  return { period, planId, startDay };
}

export async function setBudgetPeriodStartDay(
  database: SQLiteDatabase,
  startDay: number,
  today = todayISO(),
) {
  const bounds = periodBounds(startDay, today);
  let periodId = 0;
  let planId = 0;
  const safeStartDay = Math.min(Math.max(Math.trunc(startDay), 1), 31);
  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      "INSERT OR IGNORE INTO settings (id, currency, theme_mode, budget_start_day) VALUES (1, 'IDR', 'light', ?);",
      safeStartDay,
    );
    await transaction.runAsync(
      'UPDATE settings SET budget_start_day = ? WHERE id = 1;',
      safeStartDay,
    );
    const existing = await transaction.getFirstAsync<PeriodRow>(
      'SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE start_date = ? AND end_date = ? LIMIT 1;',
      bounds.startDate,
      bounds.endDate,
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
    startDay: safeStartDay,
  };
}
