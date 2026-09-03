import migrations from '../../drizzle/migrations';

describe('initial migration compatibility', () => {
  it('can resume an existing pre-journal database without replacing tables', () => {
    const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => { exec(source: string): void; prepare(source: string): { get(...params: unknown[]): Record<string, unknown> | undefined }; close(): void } };
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec(`CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, icon TEXT NOT NULL, archived INTEGER NOT NULL); CREATE TABLE wallets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, initial_balance INTEGER NOT NULL, is_savings INTEGER NOT NULL, archived INTEGER NOT NULL); CREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, wallet_id INTEGER, to_wallet_id INTEGER, category_id INTEGER, amount INTEGER NOT NULL, date TEXT NOT NULL, note TEXT); INSERT INTO wallets (name, initial_balance, is_savings, archived) VALUES ('Tunai', 500, 0, 0);`);

    for (const migration of Object.values(migrations.migrations)) {
      for (const statement of migration.split('--> statement-breakpoint')) sqlite.exec(statement);
    }

    expect(sqlite.prepare('SELECT name, initial_balance FROM wallets LIMIT 1;').get()).toEqual({ name: 'Tunai', initial_balance: 0 });
    expect(sqlite.prepare(`
      SELECT t.type, t.amount, t.is_initial, c.name AS category_name
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.wallet_id = 1;
    `).get()).toEqual({ type: 'income', amount: 500, is_initial: 1, category_name: 'Saldo Awal' });
    sqlite.close();
  });
});
