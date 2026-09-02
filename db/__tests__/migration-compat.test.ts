import migrations from '../../drizzle/migrations';

describe('initial migration compatibility', () => {
  it('can resume an existing pre-journal database without replacing tables', () => {
    const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => { exec(source: string): void; prepare(source: string): { get(...params: unknown[]): Record<string, unknown> | undefined }; close(): void } };
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec(`CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL, icon TEXT NOT NULL, archived INTEGER NOT NULL); CREATE TABLE wallets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, initial_balance INTEGER NOT NULL, is_savings INTEGER NOT NULL, archived INTEGER NOT NULL); CREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, wallet_id INTEGER, to_wallet_id INTEGER, category_id INTEGER, amount INTEGER NOT NULL, date TEXT NOT NULL, note TEXT); INSERT INTO wallets (name, initial_balance, is_savings, archived) VALUES ('Tunai', 500, 0, 0);`);

    for (const statement of migrations.migrations['20260901102535_foamy_runaways'].split('--> statement-breakpoint')) sqlite.exec(statement);

    expect(sqlite.prepare('SELECT name, initial_balance FROM wallets LIMIT 1;').get()).toEqual({ name: 'Tunai', initial_balance: 500 });
    sqlite.close();
  });
});
