import type { SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../../drizzle/migrations';
import { configureDatabase } from '../../../db/database';
import { seedDefaultCategories } from '../../../db/seed';
import { createWallet, getWallets } from '@/services/wallet-service';
import { archiveDatabaseCategory, getDatabaseTransactionCategories, getDatabaseTransactions, hasSimilarIncome, saveDatabaseTransaction } from '@/services/transaction-service';
import type { TransactionDraft } from '@/types/domain';

type TempSQLite = {
  exec(source: string): void;
  prepare(source: string): {
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
  };
  close(): void;
};

function createDatabase() {
  const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => TempSQLite };
  const sqlite = new DatabaseSync(':memory:');
  const database = {
    execAsync: async (source: string) => sqlite.exec(source),
    getFirstAsync: async <T>(source: string, ...params: unknown[]) => sqlite.prepare(source).get(...params) as T | undefined,
    getAllAsync: async <T>(source: string, ...params: unknown[]) => sqlite.prepare(source).all(...params) as T[],
    runAsync: async (source: string, ...params: unknown[]) => {
      const result = sqlite.prepare(source).run(...params);
      return { changes: result.changes, lastInsertRowId: result.lastInsertRowid };
    },
    withExclusiveTransactionAsync: async (task: (transaction: SQLiteDatabase) => Promise<void>) => task(database as unknown as SQLiteDatabase),
  } as unknown as SQLiteDatabase;
  return { database, sqlite };
}

async function prepareDatabase(database: SQLiteDatabase, sqlite: TempSQLite) {
  await configureDatabase(database);
  for (const migration of Object.values(migrations.migrations)) {
    for (const statement of migration.split('--> statement-breakpoint')) sqlite.exec(statement);
  }
  await seedDefaultCategories(database);
}

describe('database transaction service', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;
  let walletId: string;
  let secondWalletId: string;
  let incomeCategoryId: string;
  let expenseCategoryId: string;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
    walletId = (await createWallet(database, 'BCA', 1000)).id;
    secondWalletId = (await createWallet(database, 'Tunai', 0)).id;
    const categories = await getDatabaseTransactionCategories(database);
    incomeCategoryId = categories.find((category) => category.name === 'Gaji')!.id;
    expenseCategoryId = categories.find((category) => category.name === 'Makan')!.id;
  });

  afterEach(() => sqlite.close());

  it('keeps transfers wealth-neutral while applying income and expense to balances', async () => {
    const income = await saveDatabaseTransaction(database, {
      type: 'income', walletId, toWalletId: null, categoryId: incomeCategoryId,
      amount: 500, date: '2026-09-02', time: '08:00', note: 'Gaji',
    });
    await saveDatabaseTransaction(database, {
      type: 'expense', walletId, toWalletId: null, categoryId: expenseCategoryId,
      amount: 200, date: '2026-09-02', time: '09:00', note: 'Makan',
    });
    await saveDatabaseTransaction(database, {
      type: 'transfer', walletId, toWalletId: secondWalletId, categoryId: null,
      amount: 100, date: '2026-09-02', time: '10:00', note: 'Pindah',
    });

    expect((await getWallets(database)).map((wallet) => wallet.balance)).toEqual([1200, 100]);
    expect((await getDatabaseTransactions(database)).map((transaction) => transaction.id)).toHaveLength(3);
    expect(hasSimilarIncome(await getDatabaseTransactions(database), {
      type: 'income', walletId, toWalletId: null, categoryId: incomeCategoryId,
      amount: 500, date: '2026-09-02', time: '11:00', note: 'Gaji kedua',
    })).toBe(true);
    expect(income.type).toBe('income');
  });

  it('edits by replacing the old ledger row so wallet balances stay consistent', async () => {
    const draft: TransactionDraft = {
      type: 'expense', walletId, toWalletId: null, categoryId: expenseCategoryId,
      amount: 200, date: '2026-09-02', time: '09:00', note: 'Makan',
    };
    const transaction = await saveDatabaseTransaction(database, draft);
    const edited = await saveDatabaseTransaction(database, { ...draft, amount: 300, note: 'Makan siang' }, transaction.id);

    expect(edited.id).not.toBe(transaction.id);
    expect((await getWallets(database))[0].balance).toBe(700);
    expect((await getDatabaseTransactions(database)).map((item) => item.note)).toEqual(['Makan siang']);
  });

  it('archives a used category instead of deleting its history', async () => {
    await saveDatabaseTransaction(database, {
      type: 'expense', walletId, toWalletId: null, categoryId: expenseCategoryId,
      amount: 200, date: '2026-09-02', time: '09:00', note: 'Makan',
    });
    await archiveDatabaseCategory(database, expenseCategoryId);

    expect((await getDatabaseTransactionCategories(database)).find((item) => item.id === expenseCategoryId)?.archived).toBe(true);
    expect((await getDatabaseTransactions(database))).toHaveLength(1);
  });
});
