import migrations from '../../../drizzle/migrations';

// Uji upgrade dari instalasi lama (panduan seksi 9/19 + ADR-0010): database
// yang hanya menjalankan migrasi sampai titik tertentu harus bisa di-upgrade
// oleh migrasi tersisa tanpa kehilangan data, dan schema akhirnya identik
// dengan instalasi fresh.
type Sqlite = {
  exec(source: string): void;
  prepare(source: string): {
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
    run(...params: unknown[]): { changes: number; lastInsertRowid: number };
  };
  close(): void;
};

function openDatabase(): Sqlite {
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (path: string) => Sqlite;
  };
  return new DatabaseSync(':memory:');
}

function applyStatements(sqlite: Sqlite, sql: string) {
  for (const statement of sql.split('--> statement-breakpoint')) sqlite.exec(statement);
}

function tableNames(sqlite: Sqlite): string[] {
  return sqlite
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;`,
    )
    .all()
    .map((row) => row.name as string);
}

const allMigrations = Object.values(migrations.migrations);

describe('upgrade dari instalasi lama (migrasi incremental)', () => {
  it('menjalankan migrasi tersisa di atas DB lama tanpa kehilangan data', () => {
    const older = openDatabase();
    // Instalasi lama: semua migrasi kecuali yang terakhir sudah diterapkan.
    for (const migration of allMigrations.slice(0, -1)) applyStatements(older, migration);

    older
      .prepare(
        'INSERT INTO wallets (name, initial_balance, is_savings, archived) VALUES (?, ?, 0, 0);',
      )
      .run('Tunai', 350000);

    const oldTables = tableNames(older);

    // Upgrade: jalankan migrasi terakhir.
    applyStatements(older, allMigrations[allMigrations.length - 1]);

    expect(tableNames(older)).toEqual(oldTables);

    const wallet = older
      .prepare('SELECT name, initial_balance FROM wallets WHERE name = ?;')
      .get('Tunai');
    expect(wallet).toEqual({ name: 'Tunai', initial_balance: 350000 });

    // DB lama yang sudah di-upgrade tetap bisa dipakai menulis data baru.
    older
      .prepare(
        'INSERT INTO wallets (name, initial_balance, is_savings, archived) VALUES (?, ?, 0, 0);',
      )
      .run('BCA', 2000000);
    const count = Number(older.prepare('SELECT COUNT(*) AS count FROM wallets;').get()?.count);
    expect(count).toBe(2);
    older.close();
  });

  it('schema setelah upgrade identik dengan instalasi fresh', () => {
    const upgraded = openDatabase();
    for (const migration of allMigrations.slice(0, -1)) applyStatements(upgraded, migration);
    applyStatements(upgraded, allMigrations[allMigrations.length - 1]);

    const fresh = openDatabase();
    for (const migration of allMigrations) applyStatements(fresh, migration);

    expect(tableNames(upgraded)).toEqual(tableNames(fresh));

    const columns = (sqlite: Sqlite, table: string) =>
      sqlite
        .prepare(`PRAGMA table_info(${table});`)
        .all()
        .map((row) => row.name);
    for (const table of tableNames(fresh)) {
      expect(columns(upgraded, table)).toEqual(columns(fresh, table));
    }

    upgraded.close();
    fresh.close();
  });
});
