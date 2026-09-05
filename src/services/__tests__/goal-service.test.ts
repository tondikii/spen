import type { SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../../drizzle/migrations';
import { configureDatabase } from '../../../db/database';
import { seedDefaultCategories } from '../../../db/seed';
import {
  createGoal,
  archiveGoal,
  getDatabaseGoals,
  getGoalProgress,
  saveToGoal,
  updateGoal,
  withdrawFromGoal,
} from '@/services/goal-service';
import { createWallet, getWallets } from '@/services/wallet-service';

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

describe('goal service', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
  });

  afterEach(() => sqlite.close());

  it('creates and edits a Goal backed by a savings Wallet', async () => {
    const wallet = await createWallet(database, 'Dana Nikah', 1000);
    const goal = await createGoal(database, {
      name: 'Dana Nikah',
      targetAmount: 5000,
      targetDate: '2027-01-01',
      walletId: wallet.id,
      monthlyContribution: 400,
    });

    expect(goal.archived).toBe(false);
    expect((await getWallets(database))[0].isSavings).toBe(true);
    expect(await getGoalProgress(database, goal)).toEqual({
      goalId: goal.id,
      savedAmount: 1000,
      progressPercent: 20,
      achieved: false,
    });

    const edited = await updateGoal(database, goal.id, {
      ...goal,
      name: 'Dana Nikah Baru',
      targetAmount: 1000,
    });
    expect(edited.name).toBe('Dana Nikah Baru');
    expect((await getGoalProgress(database, edited)).achieved).toBe(true);
  });

  it('saves through transfer and withdraws through an expense while preserving ledger consistency', async () => {
    const source = await createWallet(database, 'BCA', 2000);
    const goalWallet = await createWallet(database, 'Tabungan', 500);
    const goal = await createGoal(database, {
      name: 'Dana Darurat',
      targetAmount: 5000,
      targetDate: null,
      walletId: goalWallet.id,
      monthlyContribution: 250,
    });

    await saveToGoal(database, goal.id, source.id, 750, '2026-09-02');
    expect((await getWallets(database)).map((wallet) => wallet.balance)).toEqual([1250, 1250]);
    expect((await getGoalProgress(database, goal)).savedAmount).toBe(1250);

    await withdrawFromGoal(database, goal.id, 250, '2026-09-03');
    expect((await getWallets(database)).map((wallet) => wallet.balance)).toEqual([1250, 1000]);
    expect((await getDatabaseGoals(database)).length).toBe(1);
  });

  it('archives a Goal without deleting its history', async () => {
    const wallet = await createWallet(database, 'Tabungan', 0);
    const goal = await createGoal(database, {
      name: 'Motor',
      targetAmount: 10000,
      targetDate: null,
      walletId: wallet.id,
      monthlyContribution: 0,
    });

    await archiveGoal(database, goal.id);

    expect(await getDatabaseGoals(database)).toEqual([]);
    expect((await getDatabaseGoals(database, true))[0]).toMatchObject({
      id: goal.id,
      archived: true,
    });
  });

  it('does not allow two active Goals to share one Wallet', async () => {
    const wallet = await createWallet(database, 'Tabungan', 0);
    await createGoal(database, {
      name: 'Goal pertama',
      targetAmount: 1000,
      targetDate: null,
      walletId: wallet.id,
      monthlyContribution: 0,
    });

    await expect(
      createGoal(database, {
        name: 'Goal kedua',
        targetAmount: 1000,
        targetDate: null,
        walletId: wallet.id,
        monthlyContribution: 0,
      }),
    ).rejects.toThrow('Wallet sudah dipakai Goal lain');
  });

  it('clears the savings marker from the old Wallet when moving a Goal', async () => {
    const firstWallet = await createWallet(database, 'Tabungan Lama', 0);
    const secondWallet = await createWallet(database, 'Tabungan Baru', 0);
    const goal = await createGoal(database, {
      name: 'Liburan',
      targetAmount: 1000,
      targetDate: null,
      walletId: firstWallet.id,
      monthlyContribution: 100,
    });

    await updateGoal(database, goal.id, { ...goal, walletId: secondWallet.id });

    expect((await getWallets(database)).map((wallet) => wallet.isSavings)).toEqual([false, true]);
  });

  it('does not allow Goals to use an archived Wallet', async () => {
    const wallet = await createWallet(database, 'Wallet Lama', 0);
    await database.runAsync(
      'UPDATE wallets SET archived = 1 WHERE id = ?;',
      Number(wallet.id.replace('wallet-', '')),
    );

    await expect(
      createGoal(database, {
        name: 'Goal',
        targetAmount: 1000,
        targetDate: null,
        walletId: wallet.id,
        monthlyContribution: 0,
      }),
    ).rejects.toThrow('Wallet Goal tidak ditemukan atau sudah diarsipkan');
  });
});
