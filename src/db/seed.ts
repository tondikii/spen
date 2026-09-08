import type { SQLiteDatabase } from 'expo-sqlite';

export const DEFAULT_CATEGORIES = [
  {
    name: 'Gaji',
    systemKey: 'salary',
    type: 'income',
    icon: 'cash-multiple',
    isAdjustment: 0,
  },
  {
    name: 'Freelance',
    systemKey: 'freelance',
    type: 'income',
    icon: 'briefcase-outline',
    isAdjustment: 0,
  },
  {
    name: 'Bonus',
    systemKey: 'bonus',
    type: 'income',
    icon: 'gift-outline',
    isAdjustment: 0,
  },
  {
    name: 'Usaha',
    systemKey: 'business',
    type: 'income',
    icon: 'storefront-outline',
    isAdjustment: 0,
  },
  {
    name: 'Penjualan',
    systemKey: 'sales',
    type: 'income',
    icon: 'package-variant-closed',
    isAdjustment: 0,
  },
  {
    name: 'Tunjangan',
    systemKey: 'allowance',
    type: 'income',
    icon: 'hand-coin-outline',
    isAdjustment: 0,
  },
  {
    name: 'Investasi',
    systemKey: 'investment',
    type: 'income',
    icon: 'chart-line',
    isAdjustment: 0,
  },
  {
    name: 'Hadiah',
    systemKey: 'giftIncome',
    type: 'income',
    icon: 'gift-outline',
    isAdjustment: 0,
  },
  {
    name: 'Pengembalian Dana',
    systemKey: 'refund',
    type: 'income',
    icon: 'cash-refund',
    isAdjustment: 0,
  },
  {
    name: 'Makan',
    systemKey: 'food',
    type: 'expense',
    icon: 'silverware-fork-knife',
    isAdjustment: 0,
  },
  { name: 'Transport', systemKey: 'transport', type: 'expense', icon: 'bus', isAdjustment: 0 },
  { name: 'Belanja', systemKey: 'shopping', type: 'expense', icon: 'cart', isAdjustment: 0 },
  { name: 'Sewa', systemKey: 'rent', type: 'expense', icon: 'home-outline', isAdjustment: 0 },
  { name: 'Internet', systemKey: 'internet', type: 'expense', icon: 'wifi', isAdjustment: 0 },
  {
    name: 'Hiburan',
    systemKey: 'entertainment',
    type: 'expense',
    icon: 'movie-open-outline',
    isAdjustment: 0,
  },
  {
    name: 'Kebutuhan Harian',
    systemKey: 'dailyNeeds',
    type: 'expense',
    icon: 'basket',
    isAdjustment: 0,
  },
  {
    name: 'Listrik',
    systemKey: 'electricity',
    type: 'expense',
    icon: 'lightbulb-outline',
    isAdjustment: 0,
  },
  { name: 'Air', systemKey: 'water', type: 'expense', icon: 'water-outline', isAdjustment: 0 },
  {
    name: 'Pulsa & Data',
    systemKey: 'phoneAndData',
    type: 'expense',
    icon: 'cellphone',
    isAdjustment: 0,
  },
  {
    name: 'Kesehatan',
    systemKey: 'health',
    type: 'expense',
    icon: 'medical-bag',
    isAdjustment: 0,
  },
  {
    name: 'Pendidikan',
    systemKey: 'education',
    type: 'expense',
    icon: 'school-outline',
    isAdjustment: 0,
  },
  {
    name: 'Cicilan',
    systemKey: 'installment',
    type: 'expense',
    icon: 'credit-card-outline',
    isAdjustment: 0,
  },
  {
    name: 'Asuransi',
    systemKey: 'insurance',
    type: 'expense',
    icon: 'shield-check-outline',
    isAdjustment: 0,
  },
  {
    name: 'Pajak',
    systemKey: 'tax',
    type: 'expense',
    icon: 'receipt-text-outline',
    isAdjustment: 0,
  },
  {
    name: 'Langganan',
    systemKey: 'subscription',
    type: 'expense',
    icon: 'calendar-month-outline',
    isAdjustment: 0,
  },
  {
    name: 'Perawatan Diri',
    systemKey: 'personalCare',
    type: 'expense',
    icon: 'heart-outline',
    isAdjustment: 0,
  },
  {
    name: 'Keluarga',
    systemKey: 'family',
    type: 'expense',
    icon: 'account-group-outline',
    isAdjustment: 0,
  },
  {
    name: 'Anak',
    systemKey: 'childcare',
    type: 'expense',
    icon: 'baby-face-outline',
    isAdjustment: 0,
  },
  {
    name: 'Hewan Peliharaan',
    systemKey: 'pets',
    type: 'expense',
    icon: 'paw',
    isAdjustment: 0,
  },
  {
    name: 'Liburan',
    systemKey: 'travel',
    type: 'expense',
    icon: 'airplane',
    isAdjustment: 0,
  },
  {
    name: 'Donasi',
    systemKey: 'donation',
    type: 'expense',
    icon: 'account-heart-outline',
    isAdjustment: 0,
  },
  {
    name: 'Olahraga',
    systemKey: 'sports',
    type: 'expense',
    icon: 'dumbbell',
    isAdjustment: 0,
  },
  {
    name: 'Perawatan Rumah',
    systemKey: 'homeMaintenance',
    type: 'expense',
    icon: 'tools',
    isAdjustment: 0,
  },
  {
    name: 'Bahan Bakar',
    systemKey: 'fuel',
    type: 'expense',
    icon: 'gas-station-outline',
    isAdjustment: 0,
  },
  {
    name: 'Parkir & Tol',
    systemKey: 'parkingAndTolls',
    type: 'expense',
    icon: 'car',
    isAdjustment: 0,
  },
  {
    name: 'Pakaian',
    systemKey: 'clothing',
    type: 'expense',
    icon: 'tshirt-crew-outline',
    isAdjustment: 0,
  },
  {
    name: 'Biaya Admin',
    systemKey: 'adminFee',
    type: 'expense',
    icon: 'bank-outline',
    isAdjustment: 0,
  },
  {
    name: 'Transfer',
    systemKey: 'transfer',
    type: 'transfer',
    icon: 'bank-transfer',
    isAdjustment: 0,
  },
  {
    name: 'Saldo Awal',
    systemKey: 'openingBalance',
    type: 'income',
    icon: 'wallet-plus-outline',
    isAdjustment: 1,
  },
  {
    name: 'Penyesuaian Saldo',
    systemKey: 'balanceAdjustment',
    type: 'expense',
    icon: 'scale-balance',
    isAdjustment: 1,
  },
] as const;

export async function seedDefaultCategories(database: SQLiteDatabase) {
  const seed = async (transaction: SQLiteDatabase) => {
    for (const category of DEFAULT_CATEGORIES) {
      const existing = await transaction.getFirstAsync<{
        id: number;
        system_key: string | null;
        icon: string;
      }>(
        'SELECT id, system_key, icon FROM categories WHERE (system_key = ? OR (system_key IS NULL AND name = ?)) AND type = ? LIMIT 1;',
        category.systemKey,
        category.name,
        category.type,
      );
      if (existing) {
        await transaction.runAsync(
          'UPDATE categories SET system_key = ?, icon = ? WHERE id = ?;',
          category.systemKey,
          existing.system_key === null ? existing.icon : category.icon,
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
        `INSERT INTO settings (id, currency, theme_mode, locale, budget_start_day) VALUES (1, 'IDR', 'light', 'en', 1);`,
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
