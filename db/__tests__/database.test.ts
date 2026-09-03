import type { SQLiteDatabase } from 'expo-sqlite';

import migrations from '../../drizzle/migrations';
import { configureDatabase } from '../database';
import { seedDefaultCategories } from '../seed';

describe('database foundation', () => {
  // Node 24's built-in SQLite gives Jest a real temporary database without
  // depending on a native Expo module that is unavailable in the test runner.
  let sqlite: { exec(source: string): void; prepare(source: string): { get(...params: unknown[]): Record<string, unknown> | undefined; all(...params: unknown[]): Record<string, unknown>[]; run(...params: unknown[]): unknown }; close(): void };
  let database: SQLiteDatabase;

  beforeEach(async () => {
    const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => typeof sqlite };
    sqlite = new DatabaseSync(':memory:');
    database = {
      execAsync: async (source: string) => sqlite.exec(source),
      getFirstAsync: async <T>(source: string, ...params: unknown[]) => sqlite.prepare(source).get(...params) as T | undefined,
      getAllAsync: async <T>(source: string, ...params: unknown[]) => sqlite.prepare(source).all(...params) as T[],
      runAsync: async (source: string, ...params: unknown[]) => sqlite.prepare(source).run(...params),
    } as unknown as SQLiteDatabase;
    await configureDatabase(database);
    for (const migration of Object.values(migrations.migrations)) {
      for (const statement of migration.split('--> statement-breakpoint')) {
        sqlite.exec(statement);
      }
    }
    await seedDefaultCategories(database);
  });

  afterEach(async () => {
    sqlite.close();
  });

  it('runs migrations and creates the complete domain model', async () => {
    const tables = await database.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`,
    );

    expect(tables.map((table) => table.name)).toEqual([
      'allocation_items',
      'budget_periods',
      'budget_plans',
      'categories',
      'expense_items',
      'fixed_expense_items',
      'goals',
      'income_items',
      'settings',
      'transactions',
      'wallets',
    ]);
  });

  it('enables foreign keys and seeds categories idempotently', async () => {
    const pragma = await database.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys;');
    expect(pragma?.foreign_keys).toBe(1);

    const firstCount = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM categories;',
    );
    await seedDefaultCategories(database);
    const secondCount = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM categories;',
    );

    expect(firstCount?.count).toBe(12);
    expect(secondCount?.count).toBe(12);
    expect(await database.getFirstAsync('SELECT id FROM settings WHERE id = 1;')).toBeTruthy();
  });
});
