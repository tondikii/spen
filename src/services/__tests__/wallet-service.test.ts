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

  it('creates a Wallet and records saldo awal as an income ledger transaction', async () => {
    const wallet = await createWallet(database, 'Tunai', 350000);
    const initialTransaction = await database.getFirstAsync<{ type: string; amount: number; is_initial: number; category_name: string }>(
      `SELECT t.type, t.amount, t.is_initial, c.name AS category_name
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.wallet_id = ? LIMIT 1;`,
      Number(wallet.id.replace('wallet-', '')),
    );

    expect(wallet.name).toBe('Tunai');
    expect(wallet.initialBalance).toBe(350000);
    expect(wallet.balance).toBe(350000);
    expect(initialTransaction).toEqual({ type: 'income', amount: 350000, is_initial: 1, category_name: 'Saldo Awal' });
    expect((await getWallets(database)).map((item) => item.id)).toContain(wallet.id);
  });

  it('renames a Wallet and corrects its balance through a transaction adjustment', async () => {
    const wallet = await createWallet(database, 'Tunai', 350000);

    const updated = await updateWallet(database, wallet.id, 'Tunai Baru', 400000);
    const adjustment = await database.getFirstAsync<{ type: string; amount: number; wallet_id: number; category_name: string }>(
      `SELECT t.type, t.amount, t.wallet_id, c.name AS category_name
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.is_initial = 0 LIMIT 1;`,
    );

    expect(updated.name).toBe('Tunai Baru');
    expect(updated.balance).toBe(400000);
    expect(adjustment).toEqual({ type: 'income', amount: 50000, wallet_id: Number(wallet.id.replace('wallet-', '')), category_name: 'Penyesuaian Saldo' });

    const lowered = await updateWallet(database, wallet.id, 'Tunai Baru', 300000);
    expect(lowered.balance).toBe(300000);
    expect(await database.getFirstAsync<{ amount: number; category_name: string }>(
      `SELECT t.type, t.amount, c.name AS category_name
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       WHERE t.is_initial = 0 ORDER BY t.id DESC LIMIT 1;`,
    )).toEqual({ type: 'expense', amount: 100000, category_name: 'Penyesuaian Saldo' });
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
    ))).toHaveLength(2);
  });
});
