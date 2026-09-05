import type { SQLiteDatabase } from 'expo-sqlite';

import i18n from '@/i18n';
import { AppError } from '@/lib/app-error';
import {
  getDatabaseTransaction,
  getDatabaseTransactionCategories,
  saveDatabaseTransaction,
} from '@/services/transaction-service';
import { getWallet, getWallets } from '@/services/wallet-service';
import type { Goal, GoalProgress, Transaction, Wallet } from '@/types/domain';

type GoalRow = {
  id: number;
  name: string;
  target_amount: number;
  target_date: string | null;
  wallet_id: number;
  monthly_contribution: number;
  archived: number;
};
export type GoalDraft = Omit<Goal, 'id' | 'archived'>;

function databaseId(value: string | number) {
  const id =
    typeof value === 'number'
      ? value
      : Number(
          String(value)
            .replace(/^goal-/, '')
            .replace(/^wallet-/, ''),
        );
  if (!Number.isInteger(id) || id < 1)
    throw new AppError('validation', undefined, `ID Goal/Wallet tidak valid: ${value}`);
  return id;
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

function validateDraft(draft: GoalDraft) {
  if (!draft.name.trim()) throw new AppError('validation', undefined, 'Nama Goal wajib diisi');
  if (!Number.isSafeInteger(draft.targetAmount) || draft.targetAmount <= 0)
    throw new AppError('validation', undefined, 'Target Goal harus berupa angka bulat positif');
  if (!Number.isSafeInteger(draft.monthlyContribution) || draft.monthlyContribution < 0)
    throw new AppError('validation', undefined, 'Kontribusi Goal tidak valid');
  databaseId(draft.walletId);
}

async function withExclusiveWrite<T>(
  database: SQLiteDatabase,
  action: (connection: SQLiteDatabase) => Promise<T>,
) {
  let result: T;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    result = await action(transaction as unknown as SQLiteDatabase);
  });
  return result!;
}

export async function getDatabaseGoals(
  database: SQLiteDatabase,
  includeArchived = false,
): Promise<Goal[]> {
  const rows = await database.getAllAsync<GoalRow>(
    `SELECT id, name, target_amount, target_date, wallet_id, monthly_contribution, archived FROM goals ${includeArchived ? '' : 'WHERE archived = 0'} ORDER BY id;`,
  );
  return rows.map(toGoal);
}

export async function getDatabaseGoal(
  database: SQLiteDatabase,
  goalId: string | number,
): Promise<Goal | null> {
  const row = await database.getFirstAsync<GoalRow>(
    'SELECT id, name, target_amount, target_date, wallet_id, monthly_contribution, archived FROM goals WHERE id = ? LIMIT 1;',
    databaseId(goalId),
  );
  return row ? toGoal(row) : null;
}

export async function getGoalProgress(database: SQLiteDatabase, goal: Goal): Promise<GoalProgress> {
  const wallet = await getWallet(database, goal.walletId);
  const savedAmount = wallet?.balance ?? 0;
  return {
    goalId: goal.id,
    savedAmount,
    progressPercent: goal.targetAmount ? (savedAmount / goal.targetAmount) * 100 : 0,
    achieved: savedAmount >= goal.targetAmount,
  };
}

export async function createGoal(database: SQLiteDatabase, draft: GoalDraft): Promise<Goal> {
  validateDraft(draft);
  const id = await withExclusiveWrite(database, async (connection) => {
    const walletId = databaseId(draft.walletId);
    const wallet = await connection.getFirstAsync<{ id: number }>(
      'SELECT id FROM wallets WHERE id = ? AND archived = 0 LIMIT 1;',
      walletId,
    );
    if (!wallet)
      throw new AppError(
        'notFound',
        undefined,
        'Wallet Goal tidak ditemukan atau sudah diarsipkan',
      );
    const existingGoal = await connection.getFirstAsync<{ id: number }>(
      'SELECT id FROM goals WHERE wallet_id = ? AND archived = 0 LIMIT 1;',
      walletId,
    );
    if (existingGoal) throw new AppError('validation', undefined, 'Wallet sudah dipakai Goal lain');
    await connection.runAsync('UPDATE wallets SET is_savings = 1 WHERE id = ?;', walletId);
    const result = await connection.runAsync(
      `INSERT INTO goals (name, target_amount, target_date, wallet_id, monthly_contribution, archived) VALUES (?, ?, ?, ?, ?, 0);`,
      draft.name.trim(),
      draft.targetAmount,
      draft.targetDate,
      walletId,
      draft.monthlyContribution,
    );
    return result.lastInsertRowId;
  });
  const goal = await getDatabaseGoal(database, id);
  if (!goal) throw new AppError('storage', undefined, 'Goal gagal dibuat');
  return goal;
}

export async function updateGoal(
  database: SQLiteDatabase,
  goalId: string,
  draft: GoalDraft,
): Promise<Goal> {
  validateDraft(draft);
  const id = databaseId(goalId);
  await withExclusiveWrite(database, async (connection) => {
    const existing = await connection.getFirstAsync<{ id: number }>(
      'SELECT id FROM goals WHERE id = ? AND archived = 0 LIMIT 1;',
      id,
    );
    if (!existing) throw new AppError('notFound', undefined, 'Goal tidak ditemukan');
    const walletId = databaseId(draft.walletId);
    const currentGoal = await connection.getFirstAsync<{ name: string; wallet_id: number }>(
      'SELECT name, wallet_id FROM goals WHERE id = ? LIMIT 1;',
      id,
    );
    const wallet = await connection.getFirstAsync<{ id: number }>(
      'SELECT id FROM wallets WHERE id = ? AND archived = 0 LIMIT 1;',
      walletId,
    );
    if (!wallet)
      throw new AppError(
        'notFound',
        undefined,
        'Wallet Goal tidak ditemukan atau sudah diarsipkan',
      );
    const existingGoal = await connection.getFirstAsync<{ id: number }>(
      'SELECT id FROM goals WHERE wallet_id = ? AND archived = 0 AND id <> ? LIMIT 1;',
      walletId,
      id,
    );
    if (existingGoal) throw new AppError('validation', undefined, 'Wallet sudah dipakai Goal lain');
    if (currentGoal && currentGoal.wallet_id !== walletId) {
      const oldWallet = await getWallet(connection, `wallet-${currentGoal.wallet_id}`);
      if (oldWallet && oldWallet.balance > 0) {
        const transferCategory = await connection.getFirstAsync<{ id: number }>(
          `SELECT id FROM categories WHERE type = 'transfer' LIMIT 1;`,
        );
        if (!transferCategory)
          throw new AppError('notFound', undefined, 'Kategori Transfer belum tersedia');
        const now = new Date();
        await connection.runAsync(
          `INSERT INTO transactions (type, wallet_id, to_wallet_id, category_id, amount, date, time, note)
           VALUES ('transfer', ?, ?, ?, ?, ?, ?, ?);`,
          currentGoal.wallet_id,
          walletId,
          transferCategory.id,
          oldWallet.balance,
          localDate(),
          now.toTimeString().slice(0, 5),
          i18n.t('common.goalWalletMoveNote', { name: currentGoal.name }),
        );
      }
      await connection.runAsync(
        'UPDATE wallets SET is_savings = 0 WHERE id = ?;',
        currentGoal.wallet_id,
      );
    }
    await connection.runAsync('UPDATE wallets SET is_savings = 1 WHERE id = ?;', walletId);
    await connection.runAsync(
      `UPDATE goals SET name = ?, target_amount = ?, target_date = ?, wallet_id = ?, monthly_contribution = ? WHERE id = ?;`,
      draft.name.trim(),
      draft.targetAmount,
      draft.targetDate,
      walletId,
      draft.monthlyContribution,
      id,
    );
  });
  const goal = await getDatabaseGoal(database, id);
  if (!goal) throw new AppError('notFound', undefined, 'Goal tidak ditemukan setelah diperbarui');
  return goal;
}

export async function archiveGoal(database: SQLiteDatabase, goalId: string): Promise<void> {
  await withExclusiveWrite(database, async (connection) => {
    const goal = await connection.getFirstAsync<{ wallet_id: number }>(
      'SELECT wallet_id FROM goals WHERE id = ? AND archived = 0 LIMIT 1;',
      databaseId(goalId),
    );
    if (!goal) throw new AppError('notFound', undefined, 'Goal tidak ditemukan');
    const result = await connection.runAsync(
      'UPDATE goals SET archived = 1 WHERE id = ? AND archived = 0;',
      databaseId(goalId),
    );
    if (result.changes === 0) throw new AppError('notFound', undefined, 'Goal tidak ditemukan');
    await connection.runAsync('UPDATE wallets SET is_savings = 0 WHERE id = ?;', goal.wallet_id);
  });
}

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function saveToGoal(
  database: SQLiteDatabase,
  goalId: string,
  sourceWalletId: string,
  amount: number,
  date = localDate(),
  time = '12:00',
): Promise<Transaction> {
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new AppError(
      'validation',
      undefined,
      'Nominal menabung harus berupa angka bulat positif',
    );
  const transactionId = await withExclusiveWrite(database, async (connection) => {
    const goal = await connection.getFirstAsync<GoalRow>(
      'SELECT id, name, target_amount, target_date, wallet_id, monthly_contribution, archived FROM goals WHERE id = ? AND archived = 0 LIMIT 1;',
      databaseId(goalId),
    );
    if (!goal) throw new AppError('notFound', undefined, 'Goal tidak ditemukan');
    const targetWalletId = `wallet-${goal.wallet_id}`;
    if (targetWalletId === sourceWalletId)
      throw new AppError('validation', undefined, 'Wallet asal dan Wallet Goal harus berbeda');
    const targetWallet = await getWallet(connection, targetWalletId);
    const sourceWallet = await getWallet(connection, sourceWalletId);
    if (!targetWallet || !sourceWallet)
      throw new AppError('notFound', undefined, 'Wallet transfer tidak ditemukan');
    if (sourceWallet.balance < amount)
      throw new AppError('validation', undefined, 'Saldo Wallet asal tidak mencukupi');
    const category = await connection.getFirstAsync<{ id: number }>(
      `SELECT id FROM categories WHERE type = 'transfer' LIMIT 1;`,
    );
    if (!category) throw new AppError('notFound', undefined, 'Kategori Transfer belum tersedia');
    const result = await connection.runAsync(
      `INSERT INTO transactions (type, wallet_id, to_wallet_id, category_id, amount, date, time, note) VALUES ('transfer', ?, ?, ?, ?, ?, ?, ?);`,
      databaseId(sourceWalletId),
      goal.wallet_id,
      category.id,
      amount,
      date,
      time,
      i18n.t('common.goalSavingNote', { name: goal.name }),
    );
    return result.lastInsertRowId;
  });
  const transaction = await getDatabaseTransaction(database, `transaction-${transactionId}`);
  if (!transaction) throw new AppError('storage', undefined, 'Transaksi menabung gagal disimpan');
  return transaction;
}

export async function withdrawFromGoal(
  database: SQLiteDatabase,
  goalId: string,
  amount: number,
  date = localDate(),
  time = '12:00',
): Promise<Transaction> {
  if (!Number.isSafeInteger(amount) || amount <= 0)
    throw new AppError(
      'validation',
      undefined,
      'Nominal penarikan harus berupa angka bulat positif',
    );
  const transactionId = await withExclusiveWrite(database, async (connection) => {
    const goal = await connection.getFirstAsync<GoalRow>(
      'SELECT id, name, target_amount, target_date, wallet_id, monthly_contribution, archived FROM goals WHERE id = ? AND archived = 0 LIMIT 1;',
      databaseId(goalId),
    );
    if (!goal) throw new AppError('notFound', undefined, 'Goal tidak ditemukan');
    const wallet = await getWallet(connection, `wallet-${goal.wallet_id}`);
    if (!wallet || wallet.balance < amount)
      throw new AppError('validation', undefined, 'Saldo Wallet Goal tidak mencukupi');
    const category = await connection.getFirstAsync<{ id: number }>(
      `SELECT id FROM categories WHERE type = 'expense' AND name = 'Belanja' AND is_adjustment = 0 LIMIT 1;`,
    );
    if (!category) throw new AppError('notFound', undefined, 'Kategori pengeluaran belum tersedia');
    const result = await connection.runAsync(
      `INSERT INTO transactions (type, wallet_id, category_id, amount, date, time, note) VALUES ('expense', ?, ?, ?, ?, ?, ?);`,
      goal.wallet_id,
      category.id,
      amount,
      date,
      time,
      i18n.t('common.goalWithdrawalNote', { name: goal.name }),
    );
    return result.lastInsertRowId;
  });
  const transaction = await getDatabaseTransaction(database, `transaction-${transactionId}`);
  if (!transaction) throw new AppError('storage', undefined, 'Transaksi penarikan gagal disimpan');
  return transaction;
}

export async function getGoalWallets(database: SQLiteDatabase): Promise<Wallet[]> {
  return getWallets(database);
}
