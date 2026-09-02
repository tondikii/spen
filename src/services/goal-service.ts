import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabaseTransactionCategories, saveDatabaseTransaction } from '@/services/transaction-service';
import { getWallet, getWallets } from '@/services/wallet-service';
import type { Goal, GoalProgress, Transaction, Wallet } from '@/types/domain';

type GoalRow = { id: number; name: string; target_amount: number; target_date: string | null; wallet_id: number; monthly_contribution: number; archived: number };
export type GoalDraft = Omit<Goal, 'id' | 'archived'>;

function databaseId(value: string | number) {
  const id = typeof value === 'number' ? value : Number(String(value).replace(/^goal-/, '').replace(/^wallet-/, ''));
  if (!Number.isInteger(id) || id < 1) throw new Error(`ID Goal/Wallet tidak valid: ${value}`);
  return id;
}

function toGoal(row: GoalRow): Goal {
  return { id: `goal-${row.id}`, name: row.name, targetAmount: row.target_amount, targetDate: row.target_date, walletId: `wallet-${row.wallet_id}`, monthlyContribution: row.monthly_contribution, archived: Boolean(row.archived) };
}

function validateDraft(draft: GoalDraft) {
  if (!draft.name.trim()) throw new Error('Nama Goal wajib diisi');
  if (!Number.isSafeInteger(draft.targetAmount) || draft.targetAmount <= 0) throw new Error('Target Goal harus berupa angka bulat positif');
  if (!Number.isSafeInteger(draft.monthlyContribution) || draft.monthlyContribution < 0) throw new Error('Kontribusi Goal tidak valid');
  databaseId(draft.walletId);
}

async function withExclusiveWrite<T>(database: SQLiteDatabase, action: (connection: SQLiteDatabase) => Promise<T>) {
  let result: T;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    result = await action(transaction as unknown as SQLiteDatabase);
  });
  return result!;
}

export async function getDatabaseGoals(database: SQLiteDatabase, includeArchived = false): Promise<Goal[]> {
  const rows = await database.getAllAsync<GoalRow>(
    `SELECT id, name, target_amount, target_date, wallet_id, monthly_contribution, archived FROM goals ${includeArchived ? '' : 'WHERE archived = 0'} ORDER BY id;`,
  );
  return rows.map(toGoal);
}

export async function getDatabaseGoal(database: SQLiteDatabase, goalId: string | number): Promise<Goal | null> {
  const row = await database.getFirstAsync<GoalRow>(
    'SELECT id, name, target_amount, target_date, wallet_id, monthly_contribution, archived FROM goals WHERE id = ? LIMIT 1;',
    databaseId(goalId),
  );
  return row ? toGoal(row) : null;
}

export async function getGoalProgress(database: SQLiteDatabase, goal: Goal): Promise<GoalProgress> {
  const wallet = await getWallet(database, goal.walletId);
  const savedAmount = wallet?.balance ?? 0;
  return { goalId: goal.id, savedAmount, progressPercent: goal.targetAmount ? savedAmount / goal.targetAmount * 100 : 0, achieved: savedAmount >= goal.targetAmount };
}

export async function createGoal(database: SQLiteDatabase, draft: GoalDraft): Promise<Goal> {
  validateDraft(draft);
  const id = await withExclusiveWrite(database, async (connection) => {
    const walletId = databaseId(draft.walletId);
    const wallet = await connection.getFirstAsync<{ id: number }>('SELECT id FROM wallets WHERE id = ? LIMIT 1;', walletId);
    if (!wallet) throw new Error('Wallet Goal tidak ditemukan');
    await connection.runAsync('UPDATE wallets SET is_savings = 1 WHERE id = ?;', walletId);
    const result = await connection.runAsync(
      `INSERT INTO goals (name, target_amount, target_date, wallet_id, monthly_contribution, archived) VALUES (?, ?, ?, ?, ?, 0);`,
      draft.name.trim(), draft.targetAmount, draft.targetDate, walletId, draft.monthlyContribution,
    );
    return result.lastInsertRowId;
  });
  const goal = await getDatabaseGoal(database, id);
  if (!goal) throw new Error('Goal gagal dibuat');
  return goal;
}

export async function updateGoal(database: SQLiteDatabase, goalId: string, draft: GoalDraft): Promise<Goal> {
  validateDraft(draft);
  const id = databaseId(goalId);
  await withExclusiveWrite(database, async (connection) => {
    const existing = await connection.getFirstAsync<{ id: number }>('SELECT id FROM goals WHERE id = ? AND archived = 0 LIMIT 1;', id);
    if (!existing) throw new Error('Goal tidak ditemukan');
    const walletId = databaseId(draft.walletId);
    const wallet = await connection.getFirstAsync<{ id: number }>('SELECT id FROM wallets WHERE id = ? LIMIT 1;', walletId);
    if (!wallet) throw new Error('Wallet Goal tidak ditemukan');
    await connection.runAsync('UPDATE wallets SET is_savings = 1 WHERE id = ?;', walletId);
    await connection.runAsync(
      `UPDATE goals SET name = ?, target_amount = ?, target_date = ?, wallet_id = ?, monthly_contribution = ? WHERE id = ?;`,
      draft.name.trim(), draft.targetAmount, draft.targetDate, walletId, draft.monthlyContribution, id,
    );
  });
  const goal = await getDatabaseGoal(database, id);
  if (!goal) throw new Error('Goal tidak ditemukan setelah diperbarui');
  return goal;
}

export async function archiveGoal(database: SQLiteDatabase, goalId: string): Promise<void> {
  const result = await database.runAsync('UPDATE goals SET archived = 1 WHERE id = ? AND archived = 0;', databaseId(goalId));
  if (result.changes === 0) throw new Error('Goal tidak ditemukan');
}

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export async function saveToGoal(database: SQLiteDatabase, goalId: string, sourceWalletId: string, amount: number, date = localDate(), time = '12:00'): Promise<Transaction> {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Nominal menabung harus berupa angka bulat positif');
  const goal = await getDatabaseGoal(database, goalId);
  if (!goal || goal.archived) throw new Error('Goal tidak ditemukan');
  if (goal.walletId === sourceWalletId) throw new Error('Wallet asal dan Wallet Goal harus berbeda');
  const targetWallet = await getWallet(database, goal.walletId);
  const sourceWallet = await getWallet(database, sourceWalletId);
  if (!targetWallet || !sourceWallet) throw new Error('Wallet transfer tidak ditemukan');
  if (sourceWallet.balance < amount) throw new Error('Saldo Wallet asal tidak mencukupi');
  return saveDatabaseTransaction(database, { type: 'transfer', walletId: sourceWalletId, toWalletId: goal.walletId, categoryId: null, amount, date, time, note: `Nabung untuk ${goal.name}` });
}

export async function withdrawFromGoal(database: SQLiteDatabase, goalId: string, amount: number, date = localDate(), time = '12:00'): Promise<Transaction> {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Nominal penarikan harus berupa angka bulat positif');
  const goal = await getDatabaseGoal(database, goalId);
  if (!goal || goal.archived) throw new Error('Goal tidak ditemukan');
  const wallet = await getWallet(database, goal.walletId);
  if (!wallet || wallet.balance < amount) throw new Error('Saldo Wallet Goal tidak mencukupi');
  const categories = await getDatabaseTransactionCategories(database);
  const category = categories.find((item) => item.type === 'expense' && item.name === 'Belanja') ?? categories.find((item) => item.type === 'expense' && !item.isAdjustment);
  if (!category) throw new Error('Kategori pengeluaran belum tersedia');
  return saveDatabaseTransaction(database, { type: 'expense', walletId: goal.walletId, toWalletId: null, categoryId: category.id, amount, date, time, note: `Penarikan darurat dari ${goal.name}` });
}

export async function getGoalWallets(database: SQLiteDatabase): Promise<Wallet[]> {
  return getWallets(database);
}
