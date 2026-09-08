import { AppError } from '@/utils/app-error';
import { todayISO } from '@/utils/date';
import { parsePrefixedId, withExclusiveWrite } from '@/lib/db-helpers';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { DatabaseTransactionRow } from '@/types/db-rows';
import type { Category, SystemCategoryKey, Transaction, TransactionDraft } from '@/types/domain';

function databaseId(value: string | null) {
  return parsePrefixedId(
    value,
    ['wallet-', 'category-', 'transaction-', 'expense-item-', 'income-item-'],
    `ID database tidak valid: ${value}`,
  );
}

export function getLocalDateInput(date = new Date()) {
  return todayISO(date);
}

export function isValidTransactionDate(value: string, today = getLocalDateInput()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12));
  const normalized = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-${String(parsed.getUTCDate()).padStart(2, '0')}`;
  return normalized === value && value <= today;
}

function fromDatabaseTransaction(row: DatabaseTransactionRow): Transaction {
  return {
    id: `transaction-${row.id}`,
    type: row.type,
    walletId: row.wallet_id ? `wallet-${row.wallet_id}` : null,
    toWalletId: row.to_wallet_id ? `wallet-${row.to_wallet_id}` : null,
    categoryId: row.category_id ? `category-${row.category_id}` : null,
    amount: row.amount,
    date: row.date,
    time: row.time,
    note: row.note ?? '',
    adminFee: row.admin_fee ?? 0,
    isInitial: Boolean(row.is_initial),
    isAdjustment: Boolean(row.is_adjustment),
    sourceIncomeItemId: row.source_income_item_id
      ? `income-item-${row.source_income_item_id}`
      : null,
    sourceExpenseItemId: row.source_expense_item_id
      ? `expense-item-${row.source_expense_item_id}`
      : null,
  };
}

export async function getDatabaseTransactionsInMonth(
  database: SQLiteDatabase,
  month: string,
): Promise<Transaction[]> {
  const rows = await database.getAllAsync<DatabaseTransactionRow>(
    `SELECT t.id, t.type, t.wallet_id, t.to_wallet_id, t.category_id, t.amount, t.date, t.time, t.note, t.admin_fee,
            t.is_initial, COALESCE(c.is_adjustment, 0) AS is_adjustment,
            t.source_income_item_id, t.source_expense_item_id
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.date LIKE ? || '-%'
     ORDER BY t.date DESC, t.time DESC, t.id DESC;`,
    month,
  );
  return rows.map(fromDatabaseTransaction);
}

export async function getDatabaseTransactionsBetween(
  database: SQLiteDatabase,
  startDate: string,
  endDate: string,
): Promise<Transaction[]> {
  const rows = await database.getAllAsync<DatabaseTransactionRow>(
    `SELECT t.id, t.type, t.wallet_id, t.to_wallet_id, t.category_id, t.amount, t.date, t.time, t.note, t.admin_fee,
            t.is_initial, COALESCE(c.is_adjustment, 0) AS is_adjustment,
            t.source_income_item_id, t.source_expense_item_id
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.date >= ? AND t.date <= ?
     ORDER BY t.date ASC, t.time ASC, t.id ASC;`,
    startDate,
    endDate,
  );
  return rows.map(fromDatabaseTransaction);
}

export async function getDatabaseRecentTransactions(
  database: SQLiteDatabase,
  limit: number,
): Promise<Transaction[]> {
  const rows = await database.getAllAsync<DatabaseTransactionRow>(
    `SELECT t.id, t.type, t.wallet_id, t.to_wallet_id, t.category_id, t.amount, t.date, t.time, t.note, t.admin_fee,
            t.is_initial, COALESCE(c.is_adjustment, 0) AS is_adjustment,
            t.source_income_item_id, t.source_expense_item_id
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     ORDER BY t.date DESC, t.time DESC, t.id DESC LIMIT ?;`,
    limit,
  );
  return rows.map(fromDatabaseTransaction);
}

export async function getDatabaseIncomeTransactions(
  database: SQLiteDatabase,
): Promise<Transaction[]> {
  const rows = await database.getAllAsync<DatabaseTransactionRow>(
    `SELECT t.id, t.type, t.wallet_id, t.to_wallet_id, t.category_id, t.amount, t.date, t.time, t.note, t.admin_fee,
            t.is_initial, COALESCE(c.is_adjustment, 0) AS is_adjustment,
            t.source_income_item_id, t.source_expense_item_id
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.type = 'income'
     ORDER BY t.date DESC, t.time DESC, t.id DESC;`,
  );
  return rows.map(fromDatabaseTransaction);
}

export async function getDatabaseTransaction(
  database: SQLiteDatabase,
  transactionId: string,
): Promise<Transaction | null> {
  const row = await database.getFirstAsync<DatabaseTransactionRow>(
    `SELECT t.id, t.type, t.wallet_id, t.to_wallet_id, t.category_id, t.amount, t.date, t.time, t.note, t.admin_fee,
            t.is_initial, COALESCE(c.is_adjustment, 0) AS is_adjustment,
            t.source_income_item_id, t.source_expense_item_id
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.id = ? LIMIT 1;`,
    databaseId(transactionId),
  );
  return row ? fromDatabaseTransaction(row) : null;
}

export async function getDatabaseTransactionCategories(
  database: SQLiteDatabase,
): Promise<Category[]> {
  const rows = await database.getAllAsync<{
    id: number;
    name: string;
    system_key: SystemCategoryKey | null;
    type: Category['type'];
    icon: string;
    archived: number;
    is_adjustment: number;
  }>(
    `SELECT id, name, system_key, type, icon, archived, is_adjustment FROM categories ORDER BY id;`,
  );
  return rows.map((row) => ({
    id: `category-${row.id}`,
    name: row.name,
    systemKey: row.system_key,
    type: row.type,
    icon: row.icon,
    archived: Boolean(row.archived),
    isAdjustment: Boolean(row.is_adjustment),
  }));
}

function validateDraft(draft: TransactionDraft, today = getLocalDateInput()) {
  if (!draft.walletId || !Number.isSafeInteger(draft.amount) || draft.amount <= 0) {
    throw new AppError('validation', undefined, 'Wallet dan nominal transaksi wajib diisi');
  }
  if (draft.type !== 'transfer' && !draft.categoryId)
    throw new AppError('validation', undefined, 'Kategori transaksi wajib dipilih');
  if (draft.type === 'transfer' && (!draft.toWalletId || draft.toWalletId === draft.walletId)) {
    throw new AppError('validation', undefined, 'Transfer membutuhkan dua Wallet yang berbeda');
  }
  if (!Number.isSafeInteger(draft.adminFee ?? 0) || (draft.adminFee ?? 0) < 0)
    throw new AppError('validation', undefined, 'Biaya admin harus berupa angka bulat positif');
  if (draft.type !== 'transfer' && (draft.adminFee ?? 0) !== 0)
    throw new AppError('validation', undefined, 'Biaya admin hanya berlaku untuk Transfer');
  if (!isValidTransactionDate(draft.date, today))
    throw new AppError('validation', undefined, 'Tanggal transaksi tidak valid atau belum terjadi');
  if (draft.systemCategoryKey === 'openingBalance' && draft.type !== 'income')
    throw new AppError(
      'validation',
      undefined,
      'Saldo awal hanya dapat dicatat sebagai Pendapatan',
    );
}

async function resolveCategoryId(database: SQLiteDatabase, draft: TransactionDraft) {
  if (draft.type === 'transfer') {
    const category = await database.getFirstAsync<{ id: number }>(
      `SELECT id FROM categories WHERE type = 'transfer' LIMIT 1;`,
    );
    if (!category) throw new AppError('notFound', undefined, 'Kategori Transfer belum tersedia');
    return category.id;
  }
  const isInitial = draft.systemCategoryKey === 'openingBalance';
  const category = await database.getFirstAsync<{ id: number; system_key: string | null }>(
    'SELECT id, system_key FROM categories WHERE id = ? AND type = ? AND archived = 0 AND (is_adjustment = 0 OR (? = 1 AND is_adjustment = 1)) LIMIT 1;',
    databaseId(draft.categoryId),
    draft.type,
    isInitial ? 1 : 0,
  );
  if (!category) return null;
  if (isInitial && category.system_key !== 'openingBalance') return null;
  return category.id;
}

export async function saveDatabaseTransaction(
  database: SQLiteDatabase,
  draft: TransactionDraft,
  transactionId?: string,
  today = getLocalDateInput(),
): Promise<Transaction> {
  validateDraft(draft, today);
  const savedId = await withExclusiveWrite(database, async (connection) => {
    let sourceIncomeItemId = draft.sourceIncomeItemId ? databaseId(draft.sourceIncomeItemId) : null;
    let sourceExpenseItemId = draft.sourceExpenseItemId
      ? databaseId(draft.sourceExpenseItemId)
      : null;
    let isInitialRow = 0;
    const wallet = await connection.getFirstAsync<{ id: number }>(
      'SELECT id FROM wallets WHERE id = ? AND archived = 0 LIMIT 1;',
      databaseId(draft.walletId),
    );
    if (!wallet)
      throw new AppError(
        'notFound',
        undefined,
        'Wallet transaksi tidak ditemukan atau sudah diarsipkan',
      );
    if (draft.type === 'transfer') {
      const destination = await connection.getFirstAsync<{ id: number }>(
        'SELECT id FROM wallets WHERE id = ? AND archived = 0 LIMIT 1;',
        databaseId(draft.toWalletId),
      );
      if (!destination)
        throw new AppError(
          'notFound',
          undefined,
          'Wallet tujuan tidak ditemukan atau sudah diarsipkan',
        );
    } else {
      const category = await connection.getFirstAsync<{ id: number; system_key: string | null }>(
        'SELECT id, system_key FROM categories WHERE id = ? AND type = ? AND archived = 0 AND (is_adjustment = 0 OR (? = 1 AND is_adjustment = 1)) LIMIT 1;',
        databaseId(draft.categoryId),
        draft.type,
        draft.systemCategoryKey === 'openingBalance' ? 1 : 0,
      );
      if (!category)
        throw new AppError(
          'notFound',
          undefined,
          'Kategori transaksi tidak sesuai atau sudah diarsipkan',
        );
      if (draft.systemCategoryKey === 'openingBalance' && category.system_key !== 'openingBalance')
        throw new AppError(
          'notFound',
          undefined,
          'Kategori transaksi tidak sesuai atau sudah diarsipkan',
        );
    }
    if (transactionId) {
      const id = databaseId(transactionId);
      const existing = await connection.getFirstAsync<{
        id: number;
        source_income_item_id: number | null;
        source_expense_item_id: number | null;
        is_initial: number;
      }>(
        'SELECT id, source_income_item_id, source_expense_item_id, is_initial FROM transactions WHERE id = ? LIMIT 1;',
        id,
      );
      if (!existing) throw new AppError('notFound', undefined, 'Transaksi tidak ditemukan');
      sourceIncomeItemId = existing.source_income_item_id;
      sourceExpenseItemId = existing.source_expense_item_id;
      isInitialRow = existing.is_initial;
      await connection.runAsync('DELETE FROM transactions WHERE id = ?;', id);
    }
    const result = await connection.runAsync(
      `INSERT INTO transactions (type, wallet_id, to_wallet_id, category_id, amount, date, time, note, admin_fee, is_initial, source_income_item_id, source_expense_item_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      draft.type,
      databaseId(draft.walletId),
      draft.type === 'transfer' ? databaseId(draft.toWalletId) : null,
      await resolveCategoryId(connection, draft),
      draft.amount,
      draft.date,
      draft.time,
      draft.note.trim() || null,
      draft.type === 'transfer' ? (draft.adminFee ?? 0) : 0,
      isInitialRow,
      sourceIncomeItemId,
      sourceExpenseItemId,
    );
    return result.lastInsertRowId;
  });
  const transaction = await getDatabaseTransaction(database, `transaction-${savedId}`);
  if (!transaction) throw new AppError('storage', undefined, 'Transaksi gagal disimpan');
  return transaction;
}

export async function deleteDatabaseTransaction(
  database: SQLiteDatabase,
  transactionId: string,
): Promise<void> {
  const result = await database.runAsync(
    'DELETE FROM transactions WHERE id = ?;',
    databaseId(transactionId),
  );
  if (result.changes === 0) throw new AppError('notFound', undefined, 'Transaksi tidak ditemukan');
}

export async function saveDatabaseCategory(
  database: SQLiteDatabase,
  category: Category,
): Promise<Category> {
  const id = category.id.startsWith('category-draft-') ? null : databaseId(category.id);
  if (id) {
    await database.runAsync(
      `UPDATE categories SET name = ?, system_key = NULL, icon = ?, archived = ? WHERE id = ?;`,
      category.name.trim(),
      category.icon,
      category.archived ? 1 : 0,
      id,
    );
  } else {
    const result = await database.runAsync(
      `INSERT INTO categories (name, type, icon, archived, is_adjustment) VALUES (?, ?, ?, 0, 0);`,
      category.name.trim(),
      category.type,
      category.icon,
    );
    return { ...category, id: `category-${result.lastInsertRowId}` };
  }
  const saved = (await getDatabaseTransactionCategories(database)).find(
    (item) => item.id === category.id,
  );
  if (!saved) throw new AppError('storage', undefined, 'Kategori gagal disimpan');
  return saved;
}

export async function archiveDatabaseCategory(
  database: SQLiteDatabase,
  categoryId: string,
): Promise<void> {
  const id = databaseId(categoryId);
  const used = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM transactions WHERE category_id = ? LIMIT 1;',
    id,
  );
  if (!used)
    throw new AppError(
      'validation',
      undefined,
      'Kategori hanya dapat diarsipkan setelah dipakai transaksi',
    );
  const result = await database.runAsync('UPDATE categories SET archived = 1 WHERE id = ?;', id);
  if (result.changes === 0) throw new AppError('notFound', undefined, 'Kategori tidak ditemukan');
}
