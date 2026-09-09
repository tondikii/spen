import type { SQLiteDatabase } from 'expo-sqlite';

import i18n from '@/i18n';
import { AppError } from '@/utils/app-error';
import { isValidTransactionDate, todayISO } from '@/utils/date';

import type { BudgetPlanItem } from '../model';
import { validatePlanItem, type PlanItemDraft } from './plan-item-draft';
import { categoryTypeFor, databaseId, tableFor } from './plan-item-mapping';

/**
 * Mutasi item plan yang sudah ada (tidak bergantung pada lookup plan aktif):
 * ubah detail item dan toggle status pembayaran pengeluaran manual.
 */
export async function updateDatabasePlanItem(
  database: SQLiteDatabase,
  item: BudgetPlanItem,
  draft: PlanItemDraft,
): Promise<void> {
  validatePlanItem(draft);
  if (draft.date && !isValidTransactionDate(draft.date)) throw new AppError('validation');
  if (item.type !== draft.type) throw new AppError('validation');
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const category = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM categories WHERE id = ? AND type = ? AND archived = 0 LIMIT 1;',
      databaseId(draft.categoryId),
      categoryTypeFor(draft.type),
    );
    if (!category) throw new AppError('notFound', { categoryId: draft.categoryId });
    const duplicate = await transaction.getFirstAsync<{ id: number }>(
      `SELECT id FROM ${tableFor(item.type)} WHERE budget_plan_id = (SELECT budget_plan_id FROM ${tableFor(item.type)} WHERE id = ? LIMIT 1) AND category_id = ? AND id <> ? LIMIT 1;`,
      databaseId(item.id),
      category.id,
      databaseId(item.id),
    );
    if (duplicate) throw new AppError('validation');
    const categoryName = await transaction.getFirstAsync<{ name: string }>(
      'SELECT name FROM categories WHERE id = ? LIMIT 1;',
      category.id,
    );
    const result = await transaction.runAsync(
      `UPDATE ${tableFor(item.type)} SET name = ?, category_id = ?, target_amount = ? WHERE id = ?;`,
      categoryName?.name ?? i18n.t('common.uncategorized'),
      category.id,
      draft.targetAmount,
      databaseId(item.id),
    );
    if (result.changes === 0) throw new AppError('notFound');
    if (item.type === 'income') {
      const walletId = databaseId(draft.walletId ?? item.walletId ?? '');
      const wallet = await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM wallets WHERE id = ? AND archived = 0 LIMIT 1;',
        walletId,
      );
      if (!wallet)
        throw new AppError('notFound', { walletId: draft.walletId ?? item.walletId ?? '' });
      await transaction.runAsync(
        `UPDATE transactions
         SET wallet_id = ?, category_id = ?, amount = ?, note = ?
         WHERE source_income_item_id = ?;`,
        wallet.id,
        category.id,
        draft.targetAmount,
        i18n.t('common.planIncomeNote', {
          name: categoryName?.name ?? i18n.t('common.uncategorized'),
        }),
        databaseId(item.id),
      );
      if (draft.date) {
        await transaction.runAsync(
          'UPDATE transactions SET date = ? WHERE source_income_item_id = ?;',
          draft.date,
          databaseId(item.id),
        );
      }
    }
  });
}

export async function setDatabasePlanItemPaid(
  database: SQLiteDatabase,
  item: BudgetPlanItem,
  paid: boolean,
  walletId: string,
  today = todayISO(),
): Promise<void> {
  if (item.type !== 'expense' || item.isAutomatic) throw new AppError('validation');
  const numericWalletId = Number(walletId.replace(/^wallet-/, ''));
  if (!Number.isInteger(numericWalletId) || numericWalletId < 1)
    throw new AppError('validation', { walletId });
  const numericItemId = databaseId(item.id);
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const wallet = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM wallets WHERE id = ? AND archived = 0 LIMIT 1;',
      numericWalletId,
    );
    if (!wallet) throw new AppError('notFound');
    const current = await transaction.getFirstAsync<{
      category_id: number;
      target_amount: number;
      is_paid: number;
    }>(
      'SELECT category_id, target_amount, is_paid FROM expense_items WHERE id = ? LIMIT 1;',
      numericItemId,
    );
    if (!current) throw new AppError('notFound');
    const note = i18n.t('common.planPaymentNote', { name: item.name });
    if (paid && !current.is_paid) {
      const now = new Date();
      await transaction.runAsync(
        `INSERT INTO transactions (type, wallet_id, category_id, amount, date, time, note, is_initial, source_expense_item_id) VALUES ('expense', ?, ?, ?, ?, ?, ?, 0, ?);`,
        numericWalletId,
        current.category_id,
        current.target_amount,
        today,
        now.toTimeString().slice(0, 5),
        note,
        numericItemId,
      );
    } else if (!paid && current.is_paid) {
      await transaction.runAsync(
        "DELETE FROM transactions WHERE id = (SELECT id FROM transactions WHERE type = 'expense' AND ((source_expense_item_id = ?) OR (source_expense_item_id IS NULL AND wallet_id = ? AND category_id = ? AND amount = ? AND note = ?)) ORDER BY id DESC LIMIT 1);",
        numericItemId,
        numericWalletId,
        current.category_id,
        current.target_amount,
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
