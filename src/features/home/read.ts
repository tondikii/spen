import type { SQLiteDatabase } from 'expo-sqlite';

import {
  getDatabaseRecentTransactions,
  getDatabaseTransactionCategories,
} from '@/services/transaction-service';
import { getWallets } from '@/services/wallet-service';
import type { Category, Transaction, Wallet } from '@/types/domain';

export type HomeView = {
  wallets: Wallet[];
  archivedWallets: Wallet[];
  categories: Category[];
  recentTransactions: Transaction[];
};

/** Read model layar Home: Dompet aktif + terarsip, kategori, dan 3 transaksi terbaru (SQL LIMIT). */
export async function readHomeView(database: SQLiteDatabase): Promise<HomeView> {
  const [wallets, categories, recentTransactions] = await Promise.all([
    getWallets(database, true),
    getDatabaseTransactionCategories(database),
    getDatabaseRecentTransactions(database, 3),
  ]);
  return {
    wallets: wallets.filter((wallet) => !wallet.archived),
    archivedWallets: wallets.filter((wallet) => wallet.archived),
    categories,
    recentTransactions,
  };
}
