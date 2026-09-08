import migrations from '../../../drizzle/migrations';

describe('consolidated migration baseline', () => {
  // Schema sudah final (DB fix), jadi semua migrasi di-squash menjadi satu
  // baseline. Test ini menjaga supaya tidak ada lagi migrasi incremental
  // yang ditambahkan tanpa alasan.
  it('bundles exactly one migration', () => {
    expect(Object.keys(migrations.migrations)).toHaveLength(1);
  });

  it('creates the complete final schema from the single baseline', () => {
    const { DatabaseSync } = require('node:sqlite') as {
      DatabaseSync: new (path: string) => {
        exec(source: string): void;
        prepare(source: string): {
          get(...params: unknown[]): Record<string, unknown> | undefined;
          all(...params: unknown[]): Record<string, unknown>[];
        };
        close(): void;
      };
    };
    const sqlite = new DatabaseSync(':memory:');

    for (const migration of Object.values(migrations.migrations)) {
      for (const statement of migration.split('--> statement-breakpoint')) sqlite.exec(statement);
    }

    const tables = sqlite
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`,
      )
      .all()
      .map((row) => row.name);

    expect(tables).toEqual([
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

    const columns = (table: string) =>
      sqlite
        .prepare(`PRAGMA table_info(${table});`)
        .all()
        .map((row) => row.name);

    expect(columns('transactions')).toEqual(
      expect.arrayContaining([
        'source_income_item_id',
        'source_expense_item_id',
        'admin_fee',
        'is_initial',
        'time',
      ]),
    );
    expect(columns('categories')).toEqual(expect.arrayContaining(['system_key', 'is_adjustment']));
    expect(columns('settings')).toEqual(
      expect.arrayContaining(['locale', 'theme_mode', 'budget_start_day']),
    );
    expect(columns('expense_items')).toEqual(expect.arrayContaining(['is_paid']));

    sqlite.close();
  });

  it('re-applies the baseline safely thanks to IF NOT EXISTS guards', () => {
    const { DatabaseSync } = require('node:sqlite') as {
      DatabaseSync: new (path: string) => {
        exec(source: string): void;
        prepare(source: string): {
          get(...params: unknown[]): Record<string, unknown> | undefined;
          all(...params: unknown[]): Record<string, unknown>[];
        };
        close(): void;
      };
    };
    const sqlite = new DatabaseSync(':memory:');

    const apply = () => {
      for (const migration of Object.values(migrations.migrations)) {
        for (const statement of migration.split('--> statement-breakpoint')) sqlite.exec(statement);
      }
    };

    apply();
    apply(); // Pas kedua harus diam-diam (CREATE TABLE / INDEX IF NOT EXISTS).

    const tables = sqlite
      .prepare(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`,
      )
      .all()
      .map((row) => row.name);
    expect(tables).toEqual([
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

    const indexCount = sqlite
      .prepare(`SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'index';`)
      .get()?.count;
    expect(indexCount).toBeGreaterThan(0);

    sqlite.close();
  });
});
