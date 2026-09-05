import type { SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../../drizzle/migrations';
import { seedDefaultCategories } from '../../../db/seed';
import { exportDatabase, parseBackupPayload, restoreDatabase } from '@/services/backup-service';

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
  for (const migration of Object.values(migrations.migrations)) {
    for (const statement of migration.split('--> statement-breakpoint')) sqlite.exec(statement);
  }
  await seedDefaultCategories(database);
}

describe('backup service', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
  });

  afterEach(() => sqlite.close());

  it('mengekspor seluruh data pengguna dan dapat memvalidasi payload', async () => {
    await database.runAsync(
      "INSERT INTO wallets (name, initial_balance, is_savings, archived) VALUES ('Tunai', 100000, 0, 0);",
    );
    const payload = await exportDatabase(database);

    expect(payload.version).toBe(1);
    expect(payload.data.wallets).toHaveLength(1);
    expect(payload.data.categories.length).toBeGreaterThan(0);
    expect(parseBackupPayload(JSON.stringify(payload))).toEqual(payload);
  });

  it('menolak versi backup yang tidak cocok', () => {
    expect(() => parseBackupPayload(JSON.stringify({ version: 99, data: {} }))).toThrow(
      /Versi backup tidak didukung/,
    );
  });

  it('restore menimpa data lama secara atomik', async () => {
    await database.runAsync(
      "INSERT INTO wallets (name, initial_balance, is_savings, archived) VALUES ('Lama', 1, 0, 0);",
    );
    const payload = await exportDatabase(database);
    payload.data.wallets[0].name = 'Hasil Restore';
    await database.runAsync(
      "INSERT INTO wallets (name, initial_balance, is_savings, archived) VALUES ('Tambahan', 2, 0, 0);",
    );

    const restoredLocale = await restoreDatabase(database, payload);

    expect(
      await database.getAllAsync<{ name: string }>('SELECT name FROM wallets ORDER BY id;'),
    ).toEqual([{ name: 'Hasil Restore' }]);
    expect(restoredLocale).toBe('id');
  });

  it('returns the locale stored in the restored backup', async () => {
    const payload = await exportDatabase(database);
    payload.data.settings[0].locale = 'en';

    await expect(restoreDatabase(database, payload)).resolves.toBe('en');
  });
});
