import type { SQLiteDatabase } from 'expo-sqlite';

export const DEFAULT_CATEGORIES = [
  { name: 'Gaji', type: 'income', icon: '✦', isAdjustment: 0 },
  { name: 'Freelance', type: 'income', icon: '⌁', isAdjustment: 0 },
  { name: 'Bonus', type: 'income', icon: '✺', isAdjustment: 0 },
  { name: 'Makan', type: 'expense', icon: '◒', isAdjustment: 0 },
  { name: 'Transport', type: 'expense', icon: '◉', isAdjustment: 0 },
  { name: 'Belanja', type: 'expense', icon: '▧', isAdjustment: 0 },
  { name: 'Sewa', type: 'expense', icon: '⌂', isAdjustment: 0 },
  { name: 'Internet', type: 'expense', icon: '◈', isAdjustment: 0 },
  { name: 'Hiburan', type: 'expense', icon: '♫', isAdjustment: 0 },
  { name: 'Transfer', type: 'transfer', icon: '⇄', isAdjustment: 0 },
  { name: 'Saldo Awal', type: 'income', icon: '↺', isAdjustment: 1 },
  { name: 'Penyesuaian Saldo', type: 'expense', icon: '±', isAdjustment: 1 },
] as const;

export async function seedDefaultCategories(database: SQLiteDatabase) {
  const seed = async (transaction: SQLiteDatabase) => {
    for (const category of DEFAULT_CATEGORIES) {
      const existing = await transaction.getFirstAsync<{ id: number }>(
        'SELECT id FROM categories WHERE name = ? AND type = ? LIMIT 1;',
        category.name,
        category.type,
      );
      if (!existing) {
        await transaction.runAsync(
          `INSERT INTO categories (name, type, icon, archived, is_adjustment)
           VALUES (?, ?, ?, 0, ?);`,
          category.name,
          category.type,
          category.icon,
          category.isAdjustment,
        );
      }
    }

    const setting = await transaction.getFirstAsync<{ id: number }>('SELECT id FROM settings WHERE id = 1 LIMIT 1;');
    if (!setting) {
      await transaction.runAsync(
        `INSERT INTO settings (id, currency, theme_mode, budget_start_day) VALUES (1, 'IDR', 'light', 1);`,
      );
    }
  };
  if (typeof database.withExclusiveTransactionAsync === 'function') {
    await database.withExclusiveTransactionAsync(async (transaction) => seed(transaction as unknown as SQLiteDatabase));
  } else {
    // Adapter minimal pada test/legacy runtime belum selalu punya API eksklusif.
    await seed(database);
  }
}
