import migrations from '../../../drizzle/migrations';

// Migrasi bersifat incremental (ADR-0001, skill spen-db): tiap perubahan
// schema menghasilkan satu migrasi baru yang di-generate drizzle-kit; migrasi
// lama tidak diedit. Test ini menjaga konsistensi bundle: jumlah migrasi harus
// sama dengan entri journal dan penerapan berurutan pada DB kosong harus
// menghasilkan schema final. Idempotensi runtime dijamin `useMigrations`
// lewat tabel bookkeeping-nya, bukan lewat mengulang eksekusi mentah.
describe('migration bundle (incremental)', () => {
  it('bundles one migration per journal entry, in order', () => {
    const keys = Object.keys(migrations.migrations);
    const entries = migrations.journal.entries;

    expect(entries.length).toBeGreaterThan(0);
    expect(keys.length).toBe(entries.length);

    entries.forEach((entry, idx) => {
      expect(entry.idx).toBe(idx);
      expect(keys).toContain(`${entry.when}_${entry.tag}`);
    });
  });

  it('creates the complete final schema when applied on a fresh database', () => {
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
});
