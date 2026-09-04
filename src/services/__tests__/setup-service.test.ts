import type { SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../../drizzle/migrations';
import { configureDatabase } from '../../../db/database';
import { seedDefaultCategories } from '../../../db/seed';
import {
  getDatabaseSettings,
  getSelectedCurrency,
  setDatabaseCurrency,
} from '@/services/settings-service';
import { getSetupState, completeSetup } from '@/services/setup-service';
import { getWallets } from '@/services/wallet-service';

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

describe('setup service', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
  });

  afterEach(() => sqlite.close());

  it('reports an incomplete setup without wallets and persists the first wallet plus currency', async () => {
    await expect(getSetupState(database)).resolves.toEqual({ hasWallet: false, currency: 'IDR' });

    await completeSetup(database, [{ name: 'BCA', initialBalance: 2_000_000 }], 'USD');

    await expect(getSetupState(database)).resolves.toEqual({ hasWallet: true, currency: 'USD' });
    await expect(getWallets(database)).resolves.toEqual([
      expect.objectContaining({ name: 'BCA', balance: 2_000_000 }),
    ]);
    expect(
      await database.getFirstAsync<{ category_name: string }>(
        `SELECT c.name AS category_name
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.wallet_id = 1;`,
      ),
    ).toEqual({ category_name: 'Saldo Awal' });
    expect(getSelectedCurrency()).toBe('USD');
  });

  it('does not create a second initial wallet when setup is submitted again', async () => {
    await completeSetup(database, [{ name: 'Tunai', initialBalance: 100 }], 'IDR');
    await expect(
      completeSetup(database, [{ name: 'BCA', initialBalance: 200 }], 'USD'),
    ).rejects.toThrow('Setup sudah selesai');
    expect((await getWallets(database)).map((wallet) => wallet.name)).toEqual(['Tunai']);
  });

  it('persists a later currency selection without changing any amount', async () => {
    await completeSetup(database, [{ name: 'Tunai', initialBalance: 500 }], 'IDR');
    await setDatabaseCurrency(database, 'SGD');
    await expect(getDatabaseSettings(database)).resolves.toMatchObject({ currency: 'SGD' });
    expect(
      await database.getFirstAsync<{ type: string; amount: number; is_initial: number }>(
        'SELECT type, amount, is_initial FROM transactions WHERE wallet_id = 1;',
      ),
    ).toEqual({ type: 'income', amount: 500, is_initial: 1 });
  });

  it('menyimpan semua Wallet onboarding beserta saldo awalnya secara atomik', async () => {
    await completeSetup(
      database,
      [
        { name: 'BCA', initialBalance: 2_000_000 },
        { name: 'Tunai', initialBalance: 500_000 },
      ],
      'IDR',
    );

    await expect(getWallets(database)).resolves.toEqual([
      expect.objectContaining({ name: 'BCA', balance: 2_000_000 }),
      expect.objectContaining({ name: 'Tunai', balance: 500_000 }),
    ]);
    expect(
      await database.getAllAsync<{ category_name: string }>(
        `SELECT c.name AS category_name
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.is_initial = 1 ORDER BY t.id;`,
      ),
    ).toEqual([{ category_name: 'Saldo Awal' }, { category_name: 'Saldo Awal' }]);
    expect(
      await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM transactions WHERE is_initial = 1;',
      ),
    ).toEqual({ count: 2 });
  });
});
