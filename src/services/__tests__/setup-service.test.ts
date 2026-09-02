import type { SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../../drizzle/migrations';
import { configureDatabase } from '../../../db/database';
import { seedDefaultCategories } from '../../../db/seed';
import { getSelectedCurrency } from '@/services/settings-service';
import { getSetupState, completeSetup } from '@/services/setup-service';
import { getWallets } from '@/services/wallet-service';

type TempSQLite = { exec(source: string): void; prepare(source: string): { get(...params: unknown[]): Record<string, unknown> | undefined; all(...params: unknown[]): Record<string, unknown>[]; run(...params: unknown[]): { changes: number; lastInsertRowid: number } }; close(): void };

function createDatabase() {
  const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => TempSQLite };
  const sqlite = new DatabaseSync(':memory:');
  const database = {
    execAsync: async (source: string) => sqlite.exec(source),
    getFirstAsync: async <T>(source: string, ...params: unknown[]) => sqlite.prepare(source).get(...params) as T | undefined,
    getAllAsync: async <T>(source: string, ...params: unknown[]) => sqlite.prepare(source).all(...params) as T[],
    runAsync: async (source: string, ...params: unknown[]) => { const result = sqlite.prepare(source).run(...params); return { changes: result.changes, lastInsertRowId: result.lastInsertRowid }; },
    withExclusiveTransactionAsync: async (task: (transaction: SQLiteDatabase) => Promise<void>) => task(database as unknown as SQLiteDatabase),
  } as unknown as SQLiteDatabase;
  return { database, sqlite };
}

async function prepareDatabase(database: SQLiteDatabase, sqlite: TempSQLite) {
  await configureDatabase(database);
  for (const migration of Object.values(migrations.migrations)) for (const statement of migration.split('--> statement-breakpoint')) sqlite.exec(statement);
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

    await completeSetup(database, 'BCA', 2_000_000, 'USD');

    await expect(getSetupState(database)).resolves.toEqual({ hasWallet: true, currency: 'USD' });
    await expect(getWallets(database)).resolves.toEqual([expect.objectContaining({ name: 'BCA', balance: 2_000_000 })]);
    expect(getSelectedCurrency()).toBe('USD');
  });

  it('does not create a second initial wallet when setup is submitted again', async () => {
    await completeSetup(database, 'Tunai', 100, 'IDR');
    await expect(completeSetup(database, 'BCA', 200, 'USD')).rejects.toThrow('Setup sudah selesai');
    expect((await getWallets(database)).map((wallet) => wallet.name)).toEqual(['Tunai']);
  });
});
