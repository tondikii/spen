import type { SQLiteDatabase } from 'expo-sqlite';

import i18n from '@/i18n';
import { AppError } from '@/utils/app-error';
import { todayISO, isValidTransactionDate } from '@/utils/date';
import { createWallet } from '@/features/wallet';
import { createGoal } from '@/features/goal';
import { SYSTEM_CATEGORY_NAMES } from '@/utils/domain/constants';
import type { BudgetSuggestion } from '@/lib/ai-service';
import type { BudgetPlan, BudgetPlanItem } from '../model';
import type { Category, Goal, Wallet } from '@/types/domain';
import { validatePlanItem, type PlanItemDraft } from './plan-item-draft';
import { categoryTypeFor, databaseId, tableFor } from './plan-item-mapping';
import { updateDatabasePlanItem } from './plan-item-mutations';
import { ensureActiveBudgetPlan } from './plan-period';

// Definisi yang dipindah ke sibling data, tetap diekspor dari sini agar API
// publik file ini (via src/features/plan/index.ts) tidak berubah.
export { setDatabasePlanItemPaid, updateDatabasePlanItem } from './plan-item-mutations';
export {
  ensureActiveBudgetPlan,
  getDatabaseActiveBudgetPeriod,
  setBudgetPeriodStartDay,
} from './plan-period';
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
    throw new AppError('validation');
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const category = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM categories WHERE id = ? AND type = ? AND archived = 0 LIMIT 1;',
      databaseId(draft.categoryId),
      categoryTypeFor(draft.type),
    );
    if (!category) throw new AppError('notFound', { categoryId: draft.categoryId });
    const duplicate = await transaction.getFirstAsync<{ id: number }>(
      `SELECT id FROM ${tableFor(draft.type)} WHERE budget_plan_id = ? AND category_id = ? LIMIT 1;`,
      active.planId,
      category.id,
    );
    if (duplicate) throw new AppError('validation');
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
      if (!wallet) throw new AppError('notFound', { walletId: draft.walletId ?? '' });
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
      if (result.changes === 0) throw new AppError('notFound');
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
    if (result.changes === 0) throw new AppError('notFound');
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
      throw new AppError('validation');
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
      throw new AppError('validation', { monthlyContribution });
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
    throw new AppError('validation');
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
