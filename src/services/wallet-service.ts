import type { SQLiteDatabase } from 'expo-sqlite';

import i18n from '@/i18n';
import { AppError } from '@/lib/app-error';
import type { Wallet, WalletTint } from '@/types/domain';

type WalletRow = {
  id: number;
  name: string;
  initial_balance: number;
  is_savings: number;
  archived: number;
  balance: number;
};

const TINTS: WalletTint[] = ['coral', 'pine', 'gold', 'goal'];
const INITIAL_BALANCE_CATEGORY_NAME = 'Saldo Awal';
const BALANCE_ADJUSTMENT_CATEGORY_NAME = 'Penyesuaian Saldo';

function databaseId(walletId: string | number) {
  const value = typeof walletId === 'number' ? walletId : Number(walletId.replace(/^wallet-/, ''));
  if (!Number.isInteger(value) || value < 1)
    throw new AppError('validation', undefined, `Wallet id tidak valid: ${walletId}`);
  return value;
}

function toWallet(row: WalletRow): Wallet {
  return {
    id: `wallet-${row.id}`,
    name: row.name,
    initialBalance: row.initial_balance,
    balance: row.balance,
    isSavings: Boolean(row.is_savings),
    archived: Boolean(row.archived),
    tint: TINTS[(row.id - 1) % TINTS.length],
  };
}

const walletBalanceSql = `
  SELECT
    w.id,
    w.name,
    w.initial_balance + COALESCE(SUM(CASE
      WHEN t.is_initial = 1 AND t.type = 'income' AND t.wallet_id = w.id THEN t.amount
      WHEN t.is_initial = 1 AND t.type = 'expense' AND t.wallet_id = w.id THEN -t.amount
      ELSE 0
    END), 0) AS initial_balance,
    w.is_savings,
    w.archived,
    w.initial_balance + COALESCE(SUM(CASE
      WHEN t.type = 'income' AND t.wallet_id = w.id THEN t.amount
      WHEN t.type = 'expense' AND t.wallet_id = w.id THEN -t.amount
      WHEN t.type = 'adjustment' AND t.wallet_id = w.id THEN t.amount
      WHEN t.type = 'transfer' AND t.wallet_id = w.id THEN -(t.amount + t.admin_fee)
      WHEN t.type = 'transfer' AND t.to_wallet_id = w.id THEN t.amount
      ELSE 0
    END), 0) AS balance
  FROM wallets w
  LEFT JOIN transactions t ON t.wallet_id = w.id OR t.to_wallet_id = w.id
`;

async function withExclusiveWrite<T>(
  database: SQLiteDatabase,
  action: (connection: SQLiteDatabase) => Promise<T>,
) {
  const connection = database as SQLiteDatabase & {
    withExclusiveTransactionAsync?: (
      task: (transaction: SQLiteDatabase) => Promise<void>,
    ) => Promise<void>;
  };
  let result: T;
  if (connection.withExclusiveTransactionAsync) {
    await connection.withExclusiveTransactionAsync(async (transaction) => {
      result = await action(transaction);
    });
  } else {
    result = await action(database);
  }
  return result!;
}

async function getInternalCategoryId(database: SQLiteDatabase, categoryName: string) {
  const category = await database.getFirstAsync<{ id: number }>(
    `SELECT id FROM categories WHERE name = ? AND is_adjustment = 1 LIMIT 1;`,
    categoryName,
  );
  if (!category)
    throw new AppError('notFound', undefined, `Kategori ${categoryName} belum tersedia`);
  return category.id;
}

export async function getWallets(
  database: SQLiteDatabase,
  includeArchived = false,
): Promise<Wallet[]> {
  const rows = await database.getAllAsync<WalletRow>(
    `${walletBalanceSql} ${includeArchived ? '' : 'WHERE w.archived = 0'} GROUP BY w.id ORDER BY w.id;`,
  );
  return rows.map(toWallet);
}

export async function getWallet(
  database: SQLiteDatabase,
  walletId: string | number,
): Promise<Wallet | null> {
  const id = databaseId(walletId);
  const row = await database.getFirstAsync<WalletRow>(
    `${walletBalanceSql} WHERE w.id = ? GROUP BY w.id LIMIT 1;`,
    id,
  );
  return row ? toWallet(row) : null;
}

export async function createWallet(
  database: SQLiteDatabase,
  name: string,
  initialBalance: number,
): Promise<Wallet> {
  const cleanName = name.trim();
  if (!cleanName) throw new AppError('validation', undefined, 'Nama Wallet wajib diisi');
  if (!Number.isSafeInteger(initialBalance))
    throw new AppError('validation', undefined, 'Saldo awal harus berupa angka bulat');

  const walletId = await withExclusiveWrite(database, async (connection) => {
    const result = await connection.runAsync(
      `INSERT INTO wallets (name, initial_balance, is_savings, archived) VALUES (?, 0, 0, 0);`,
      cleanName,
    );
    if (initialBalance === 0) return result.lastInsertRowId;
    const categoryId = await getInternalCategoryId(connection, INITIAL_BALANCE_CATEGORY_NAME);
    const now = new Date();
    await connection.runAsync(
      `INSERT INTO transactions (type, wallet_id, category_id, amount, date, time, note, is_initial)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1);`,
      initialBalance > 0 ? 'income' : 'expense',
      result.lastInsertRowId,
      categoryId,
      Math.abs(initialBalance),
      now.toISOString().slice(0, 10),
      now.toTimeString().slice(0, 5),
      i18n.t('common.openingBalanceNote'),
    );
    return result.lastInsertRowId;
  });
  const wallet = await getWallet(database, walletId);
  if (!wallet) throw new AppError('storage', undefined, 'Wallet gagal dibuat');
  return wallet;
}

export async function updateWallet(
  database: SQLiteDatabase,
  walletId: string | number,
  name: string,
  targetBalance?: number,
): Promise<Wallet> {
  const id = databaseId(walletId);
  const cleanName = name.trim();
  if (!cleanName) throw new AppError('validation', undefined, 'Nama Wallet wajib diisi');

  await withExclusiveWrite(database, async (connection) => {
    const current = await getWallet(connection, id);
    if (!current) throw new AppError('notFound', undefined, 'Wallet tidak ditemukan');
    await connection.runAsync('UPDATE wallets SET name = ? WHERE id = ?;', cleanName, id);

    if (targetBalance !== undefined) {
      if (!Number.isSafeInteger(targetBalance))
        throw new AppError('validation', undefined, 'Saldo Wallet harus berupa angka bulat');
      const delta = targetBalance - current.balance;
      if (delta !== 0) {
        const categoryId = await getInternalCategoryId(
          connection,
          BALANCE_ADJUSTMENT_CATEGORY_NAME,
        );
        const now = new Date();
        await connection.runAsync(
          `INSERT INTO transactions (type, wallet_id, category_id, amount, date, time, note, is_initial)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0);`,
          delta > 0 ? 'income' : 'expense',
          id,
          categoryId,
          Math.abs(delta),
          now.toISOString().slice(0, 10),
          now.toTimeString().slice(0, 5),
          i18n.t('common.balanceAdjustmentNote'),
        );
      }
    }
  });

  const wallet = await getWallet(database, id);
  if (!wallet)
    throw new AppError('notFound', undefined, 'Wallet tidak ditemukan setelah diperbarui');
  return wallet;
}

export async function archiveWallet(
  database: SQLiteDatabase,
  walletId: string | number,
): Promise<void> {
  await withExclusiveWrite(database, async (connection) => {
    const id = databaseId(walletId);
    const result = await connection.runAsync('UPDATE wallets SET archived = 1 WHERE id = ?;', id);
    if (result.changes === 0) throw new AppError('notFound', undefined, 'Wallet tidak ditemukan');
  });
}

export async function restoreWallet(
  database: SQLiteDatabase,
  walletId: string | number,
): Promise<void> {
  await withExclusiveWrite(database, async (connection) => {
    const id = databaseId(walletId);
    const result = await connection.runAsync('UPDATE wallets SET archived = 0 WHERE id = ?;', id);
    if (result.changes === 0) throw new AppError('notFound', undefined, 'Wallet tidak ditemukan');
  });
}
