import type { SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../../drizzle/migrations';
import { configureDatabase } from '../../../db/database';
import { seedDefaultCategories } from '../../../db/seed';
import { ensureActiveBudgetPlan } from '@/services/plan-service';
import { getDatabaseReportView } from '@/services/report-service';
import {
  getDatabaseTransactionCategories,
  saveDatabaseTransaction,
} from '@/services/transaction-service';
import { createWallet, updateWallet } from '@/services/wallet-service';

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
  for (const migration of Object.values(migrations.migrations))
    for (const statement of migration.split('--> statement-breakpoint')) sqlite.exec(statement);
  await seedDefaultCategories(database);
}

describe('database report service', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
  });

  afterEach(() => sqlite.close());

  it('aggregates the active period, sorts expenses, and excludes transfers', async () => {
    await ensureActiveBudgetPlan(database, '2026-09-10');
    await ensureActiveBudgetPlan(database, '2026-10-10');
    const source = await createWallet(database, 'BCA', 0);
    const destination = await createWallet(database, 'Tabungan', 0);
    const categories = await getDatabaseTransactionCategories(database);
    const income = categories.find((category) => category.name === 'Gaji')!.id;
    const food = categories.find((category) => category.name === 'Makan')!.id;
    const transport = categories.find((category) => category.name === 'Transport')!.id;

    await saveDatabaseTransaction(database, {
      type: 'income',
      walletId: source.id,
      toWalletId: null,
      categoryId: income,
      amount: 1000,
      date: '2026-10-02',
      time: '08:00',
      note: 'Gaji',
    });
    await saveDatabaseTransaction(database, {
      type: 'expense',
      walletId: source.id,
      toWalletId: null,
      categoryId: food,
      amount: 300,
      date: '2026-10-02',
      time: '09:00',
      note: 'Makan',
    });
    await saveDatabaseTransaction(database, {
      type: 'expense',
      walletId: source.id,
      toWalletId: null,
      categoryId: transport,
      amount: 100,
      date: '2026-10-02',
      time: '10:00',
      note: 'Transport',
    });
    await saveDatabaseTransaction(database, {
      type: 'transfer',
      walletId: source.id,
      toWalletId: destination.id,
      categoryId: null,
      amount: 250,
      date: '2026-10-03',
      time: '10:00',
      note: 'Tabung',
    });

    const view = await getDatabaseReportView(database, 3, '2026-10-10');
    expect(view.snapshot).toMatchObject({
      totalIncome: 1000,
      totalExpense: 400,
      totalTransferIn: 250,
      totalTransferOut: 250,
      netSaving: 600,
    });
    expect(view.expenses.map((expense) => expense.name)).toEqual(['Makan', 'Transport']);
    expect(view.netSavingByPeriod[0].period.startDate).toBe('2026-09-01');
    expect(view.netSavingByPeriod[0].netSaving).toBe(0);
    expect(view.netSavingByPeriod[1].period.startDate).toBe('2026-10-01');
    expect(view.netSavingByPeriod[1].netSaving).toBe(600);
  });

  it('includes opening balance and balance corrections in the matching report totals', async () => {
    await ensureActiveBudgetPlan(database, '2026-09-10');
    const wallet = await createWallet(database, 'BCA', 1000);

    await updateWallet(database, wallet.id, 'BCA', 500);

    const view = await getDatabaseReportView(database, 3, '2026-09-10');

    expect(view.snapshot).toMatchObject({ totalIncome: 1000, totalExpense: 500, netSaving: 500 });
    expect(view.expenses).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'Penyesuaian Saldo', amount: 500 })]),
    );
  });
});
