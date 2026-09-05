import type { SQLiteDatabase } from 'expo-sqlite';

export const DEFAULT_CATEGORIES = [
  { name: 'Gaji', systemKey: 'salary', type: 'income', icon: '✦', isAdjustment: 0 },
  { name: 'Freelance', systemKey: 'freelance', type: 'income', icon: '⌁', isAdjustment: 0 },
  { name: 'Bonus', systemKey: 'bonus', type: 'income', icon: '✺', isAdjustment: 0 },
  { name: 'Makan', systemKey: 'food', type: 'expense', icon: '◒', isAdjustment: 0 },
  { name: 'Transport', systemKey: 'transport', type: 'expense', icon: '◉', isAdjustment: 0 },
  { name: 'Belanja', systemKey: 'shopping', type: 'expense', icon: '▧', isAdjustment: 0 },
  { name: 'Sewa', systemKey: 'rent', type: 'expense', icon: '⌂', isAdjustment: 0 },
  { name: 'Internet', systemKey: 'internet', type: 'expense', icon: '◈', isAdjustment: 0 },
  { name: 'Hiburan', systemKey: 'entertainment', type: 'expense', icon: '♫', isAdjustment: 0 },
  { name: 'Transfer', systemKey: 'transfer', type: 'transfer', icon: '⇄', isAdjustment: 0 },
  { name: 'Saldo Awal', systemKey: 'openingBalance', type: 'income', icon: '↺', isAdjustment: 1 },
  {
    name: 'Penyesuaian Saldo',
    systemKey: 'balanceAdjustment',
    type: 'expense',
    icon: '±',
    isAdjustment: 1,
  },
] as const;

export async function seedDefaultCategories(database: SQLiteDatabase) {
  const seed = async (transaction: SQLiteDatabase) => {
    for (const category of DEFAULT_CATEGORIES) {
      const existing = await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM categories WHERE (system_key = ? OR (system_key IS NULL AND name = ?)) AND type = ? LIMIT 1;',
        category.systemKey,
        category.name,
        category.type,
      );
      if (existing) {
        await transaction.runAsync(
          'UPDATE categories SET system_key = ? WHERE id = ? AND system_key IS NULL;',
          category.systemKey,
          existing.id,
        );
      } else {
        await transaction.runAsync(
          `INSERT INTO categories (name, system_key, type, icon, archived, is_adjustment)
           VALUES (?, ?, ?, ?, 0, ?);`,
          category.name,
          category.systemKey,
          category.type,
          category.icon,
          category.isAdjustment,
        );
      }
    }

    const setting = await transaction.getFirstAsync<{ id: number }>(
      'SELECT id FROM settings WHERE id = 1 LIMIT 1;',
    );
    if (!setting) {
      await transaction.runAsync(
        `INSERT INTO settings (id, currency, theme_mode, locale, budget_start_day) VALUES (1, 'IDR', 'light', 'id', 1);`,
      );
    }
  };
  if (typeof database.withExclusiveTransactionAsync === 'function') {
    await database.withExclusiveTransactionAsync(async (transaction) =>
      seed(transaction as unknown as SQLiteDatabase),
    );
  } else {
    // Adapter minimal pada test/legacy runtime belum selalu punya API eksklusif.
    await seed(database);
  }
}
