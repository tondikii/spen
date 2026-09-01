import type { SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../../drizzle/migrations';
import { configureDatabase } from '../../../db/database';
import { seedDefaultCategories } from '../../../db/seed';
import { archiveWallet, createWallet, getWallet, getWallets, updateWallet } from '@/services/wallet-service';

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
  } as unknown as SQLiteDatabase;
  return { database, sqlite };
}

async function prepareDatabase(database: SQLiteDatabase, sqlite: TempSQLite) {
  await configureDatabase(database);
  for (const migration of Object.values(migrations.migrations)) {
    for (const statement of migration.split('--> statement-breakpoint')) {
      sqlite.exec(statement);
    }
  }
  await seedDefaultCategories(database);
}

describe('wallet service', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
  });

  afterEach(() => sqlite.close());

  it('creates a Wallet with a balance derived from saldo awal', async () => {
    const wallet = await createWallet(database, 'Tunai', 350000);

    expect(wallet.name).toBe('Tunai');
    expect(wallet.initialBalance).toBe(350000);
    expect(wallet.balance).toBe(350000);
    expect((await getWallets(database)).map((item) => item.id)).toContain(wallet.id);
  });

  it('renames a Wallet and corrects its balance through a transaction adjustment', async () => {
    const wallet = await createWallet(database, 'Tunai', 350000);

    const updated = await updateWallet(database, wallet.id, 'Tunai Baru', 400000);
    const adjustment = await database.getFirstAsync<{ type: string; amount: number; wallet_id: number }>(
      `SELECT type, amount, wallet_id FROM transactions WHERE type = 'adjustment' LIMIT 1;`,
    );

    expect(updated.name).toBe('Tunai Baru');
    expect(updated.balance).toBe(400000);
    expect(adjustment).toEqual({ type: 'adjustment', amount: 50000, wallet_id: Number(wallet.id.replace('wallet-', '')) });

    const lowered = await updateWallet(database, wallet.id, 'Tunai Baru', 300000);
    expect(lowered.balance).toBe(300000);
    expect(await database.getFirstAsync<{ amount: number }>(
      `SELECT amount FROM transactions WHERE type = 'adjustment' ORDER BY id DESC LIMIT 1;`,
    )).toEqual({ amount: -100000 });
  });

  it('archives a Wallet without deleting it or its transaction history', async () => {
    const wallet = await createWallet(database, 'Tunai', 350000);
    await updateWallet(database, wallet.id, 'Tunai', 400000);

    await archiveWallet(database, wallet.id);

    expect(await getWallet(database, wallet.id)).toMatchObject({ archived: true, balance: 400000 });
    expect((await getWallets(database)).some((item) => item.id === wallet.id)).toBe(false);
    expect((await database.getAllAsync<{ id: number }>(
      `SELECT id FROM transactions WHERE wallet_id = ?;`,
      Number(wallet.id.replace('wallet-', '')),
    ))).toHaveLength(1);
  });
});
