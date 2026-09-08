import type { SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../../../drizzle/migrations';
import { configureDatabase } from '@/db/client';
import { seedDefaultCategories } from '@/db/seed';
import { createWallet } from '@/features/wallet';
import {
  getDatabaseTransactionCategories,
  saveDatabaseTransaction,
} from '@/features/transactions';
import { readDailyView } from '../read';

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
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (path: string) => TempSQLite;
  };
  const sqlite = new DatabaseSync(':memory:');
  const database = {
    execAsync: async (source: string) => sqlite.exec(source),
    getFirstAsync: async <T>(source: string, ...params: unknown[]) =>
      sqlite.prepare(source).get(...params) as T | undefined,
    getAllAsync: async <T>(source: string, ...params: unknown[]) =>
      sqlite.prepare(source).all(...params) as T[],
    runAsync: async (source: string, ...params: unknown[]) => {
      const result = sqlite.prepare(source).run(...params);
      return { changes: result.changes, lastInsertRowId: result.lastInsertRowid };
    },
    withExclusiveTransactionAsync: async (task: (transaction: SQLiteDatabase) => Promise<void>) =>
      task(database as unknown as SQLiteDatabase),
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

describe('readDailyView', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;
  let walletId: string;
  let incomeCategoryId: string;
  let expenseCategoryId: string;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
    walletId = (await createWallet(database, 'Tunai', 0)).id;
    const categories = await getDatabaseTransactionCategories(database);
    incomeCategoryId = categories.find((category) => category.name === 'Gaji')!.id;
    expenseCategoryId = categories.find((category) => category.name === 'Makan')!.id;
  });

  afterEach(() => sqlite.close());

  it('memuat hanya transaksi pada bulan yang diminta beserta kategori dan Dompet', async () => {
    await saveDatabaseTransaction(database, {
      type: 'income',
      walletId,
      toWalletId: null,
      categoryId: incomeCategoryId,
      amount: 1000,
      date: '2026-09-02',
      time: '08:00',
      note: 'Dalam bulan',
    });
    await saveDatabaseTransaction(database, {
      type: 'expense',
      walletId,
      toWalletId: null,
      categoryId: expenseCategoryId,
      amount: 500,
      date: '2026-08-30',
      time: '08:00',
      note: 'Bulan sebelumnya',
    });

    const view = await readDailyView(database, '2026-09');

    expect(view.transactions.map((transaction) => transaction.date)).toEqual(['2026-09-02']);
    expect(view.wallets.map((wallet) => wallet.id)).toContain(walletId);
    expect(view.categories.length).toBeGreaterThan(0);
  });
});
