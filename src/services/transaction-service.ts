import mockData from '@/data/mock-data';
import { AppError } from '@/lib/app-error';
import type { SQLiteDatabase } from 'expo-sqlite';
import type {
  Category,
  SystemCategoryKey,
  Transaction,
  TransactionDraft,
  TransactionType,
  Wallet,
} from '@/types/domain';

export const TRANSACTION_ICON_CHOICES = [
  '◒',
  '◉',
  '▧',
  '⌂',
  '◈',
  '♫',
  '✦',
  '☕',
  '♧',
  '◌',
  '☀',
  '◍',
  '♡',
  '♨',
  '✿',
];

let mockCategories: Category[] = [...mockData.categories];
let mockTransactions: Transaction[] = [...mockData.transactions];

export function getActiveTransactionWallets() {
  return mockData.wallets.filter((wallet) => !wallet.archived);
}

export function getActiveTransactionCategories() {
  return mockCategories.filter((category) => !category.archived);
}

export function getTransactionCategories(categories: Category[], type: TransactionType) {
  const categoryType = type === 'income' ? 'income' : 'expense';
  return categories.filter(
    (category) => category.type === categoryType && !category.archived && !category.isAdjustment,
  );
}

export function getAllocationLimit(categoryId: string | null) {
  const item = mockData.budgetSnapshot.planItems.find((planItem) => {
    const plan = mockData.budgetPlans[0];
    return plan.expenseItems.some(
      (candidate) => candidate.id === planItem.itemId && candidate.categoryId === categoryId,
    );
  });
  return item
    ? (mockData.budgetPlans[0].expenseItems.find((candidate) => candidate.id === item.itemId)
        ?.targetAmount ?? 0)
    : 0;
}

export function archiveMockCategory(categories: Category[], categoryId: string) {
  const updated = categories.map((category) =>
    category.id === categoryId ? { ...category, archived: true } : category,
  );
  mockCategories = mockCategories.map((category) =>
    category.id === categoryId ? { ...category, archived: true } : category,
  );
  return updated;
}

export function saveMockCategory(categories: Category[], category: Category) {
  const updated = categories.some((item) => item.id === category.id)
    ? categories.map((item) => (item.id === category.id ? category : item))
    : [...categories, category];
  mockCategories = mockCategories.some((item) => item.id === category.id)
    ? mockCategories.map((item) => (item.id === category.id ? category : item))
    : [...mockCategories, category];
  return updated;
}

export function getMockTransactions() {
  return [...mockTransactions];
}

export function saveMockTransaction(
  transactions: Transaction[],
  draft: TransactionDraft,
  transactionId?: string,
) {
  const updated = !transactionId
    ? [...transactions, { ...draft, id: `transaction-${Date.now()}` }]
    : transactions.map((transaction) =>
        transaction.id === transactionId ? { ...draft, id: transactionId } : transaction,
      );
  mockTransactions = !transactionId
    ? [...mockTransactions, updated[updated.length - 1]]
    : mockTransactions.map((transaction) =>
        transaction.id === transactionId ? { ...draft, id: transactionId } : transaction,
      );
  return updated;
}

export function deleteMockTransaction(transactions: Transaction[], transactionId: string) {
  mockTransactions = mockTransactions.filter((transaction) => transaction.id !== transactionId);
  return transactions.filter((transaction) => transaction.id !== transactionId);
}

type DatabaseTransactionRow = {
  id: number;
  type: Transaction['type'];
  wallet_id: number | null;
  to_wallet_id: number | null;
  category_id: number | null;
  amount: number;
  date: string;
  time: string;
  note: string | null;
  admin_fee: number;
  is_initial: number;
  is_adjustment: number;
  source_income_item_id: number | null;
  source_expense_item_id: number | null;
};

function databaseId(value: string | null) {
  if (!value) return null;
  const id = Number(value.replace(/^(wallet|category|transaction|expense-item|income-item)-/, ''));
  if (!Number.isInteger(id) || id < 1)
    throw new AppError('validation', undefined, `ID database tidak valid: ${value}`);
  return id;
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

export async function getDatabaseTransactions(database: SQLiteDatabase): Promise<Transaction[]> {
  const rows = await database.getAllAsync<DatabaseTransactionRow>(
    `SELECT t.id, t.type, t.wallet_id, t.to_wallet_id, t.category_id, t.amount, t.date, t.time, t.note, t.admin_fee,
            t.is_initial, COALESCE(c.is_adjustment, 0) AS is_adjustment,
            t.source_income_item_id, t.source_expense_item_id
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
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

function validateDraft(draft: TransactionDraft) {
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
}

async function resolveCategoryId(database: SQLiteDatabase, draft: TransactionDraft) {
  if (draft.type === 'transfer') {
    const category = await database.getFirstAsync<{ id: number }>(
      `SELECT id FROM categories WHERE type = 'transfer' LIMIT 1;`,
    );
    if (!category) throw new AppError('notFound', undefined, 'Kategori Transfer belum tersedia');
    return category.id;
  }
  return databaseId(draft.categoryId);
}

export async function saveDatabaseTransaction(
  database: SQLiteDatabase,
  draft: TransactionDraft,
  transactionId?: string,
): Promise<Transaction> {
  validateDraft(draft);
  const savedId = await withExclusiveWrite(database, async (connection) => {
    let sourceIncomeItemId = draft.sourceIncomeItemId ? databaseId(draft.sourceIncomeItemId) : null;
    let sourceExpenseItemId = draft.sourceExpenseItemId ? databaseId(draft.sourceExpenseItemId) : null;
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
      const category = await connection.getFirstAsync<{ id: number }>(
        'SELECT id FROM categories WHERE id = ? AND type = ? AND archived = 0 AND is_adjustment = 0 LIMIT 1;',
        databaseId(draft.categoryId),
        draft.type,
      );
      if (!category)
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
      }>(
        'SELECT id, source_income_item_id, source_expense_item_id FROM transactions WHERE id = ? LIMIT 1;',
        id,
      );
      if (!existing) throw new AppError('notFound', undefined, 'Transaksi tidak ditemukan');
      sourceIncomeItemId = existing.source_income_item_id;
      sourceExpenseItemId = existing.source_expense_item_id;
      await connection.runAsync('DELETE FROM transactions WHERE id = ?;', id);
    }
    const result = await connection.runAsync(
      `INSERT INTO transactions (type, wallet_id, to_wallet_id, category_id, amount, date, time, note, admin_fee, source_income_item_id, source_expense_item_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      draft.type,
      databaseId(draft.walletId),
      draft.type === 'transfer' ? databaseId(draft.toWalletId) : null,
      await resolveCategoryId(connection, draft),
      draft.amount,
      draft.date,
      draft.time,
      draft.note.trim() || null,
      draft.type === 'transfer' ? (draft.adminFee ?? 0) : 0,
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

export function hasSimilarIncome(
  transactions: Transaction[],
  draft: TransactionDraft,
  transactionId?: string,
) {
  return (
    draft.type === 'income' &&
    transactions.some(
      (transaction) =>
        transaction.id !== transactionId &&
        transaction.type === 'income' &&
        transaction.walletId === draft.walletId &&
        transaction.categoryId === draft.categoryId &&
        transaction.amount === draft.amount &&
        transaction.date === draft.date,
    )
  );
}
