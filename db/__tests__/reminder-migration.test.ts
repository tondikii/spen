import migrations from '../../drizzle/migrations';

type TempSQLite = {
  exec(source: string): void;
  prepare(source: string): {
    get(...params: unknown[]): Record<string, unknown> | undefined;
  };
  close(): void;
};

describe('reminder migration', () => {
  it('preserves existing settings and applies inactive defaults', () => {
    const { DatabaseSync } = require('node:sqlite') as {
      DatabaseSync: new (path: string) => TempSQLite;
    };
    const sqlite = new DatabaseSync(':memory:');

    sqlite.exec(`
      CREATE TABLE settings (
        id INTEGER PRIMARY KEY,
        currency TEXT NOT NULL DEFAULT 'IDR',
        theme_mode TEXT NOT NULL DEFAULT 'light',
        locale TEXT NOT NULL DEFAULT 'en',
        budget_start_day INTEGER NOT NULL DEFAULT 1
      );
      INSERT INTO settings (id, currency, theme_mode, locale, budget_start_day)
      VALUES (1, 'USD', 'dark', 'id', 15);
    `);

    const reminderMigration = Object.values(migrations.migrations).at(-1);
    expect(reminderMigration).toBeDefined();
    for (const statement of reminderMigration!.split('--> statement-breakpoint')) {
      sqlite.exec(statement);
    }

    expect(sqlite.prepare('SELECT * FROM settings WHERE id = 1;').get()).toEqual(
      expect.objectContaining({
        currency: 'USD',
        theme_mode: 'dark',
        locale: 'id',
        budget_start_day: 15,
        reminders_enabled: 0,
        transaction_reminder_enabled: 0,
        period_reminder_enabled: 0,
        goal_reminder_enabled: 0,
        transaction_reminder_time: '20:00',
        notification_permission_requested: 0,
      }),
    );

    sqlite.close();
  });
});
