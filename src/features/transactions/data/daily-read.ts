import type { SQLiteDatabase } from 'expo-sqlite';

import {
  getDatabaseTransactionCategories,
  getDatabaseTransactionsInMonth,
} from './transaction-repository';
// eslint-disable-next-line no-restricted-imports -- break require cycle via wallet barrel
import { getWallets } from '@/features/wallet/data/wallet-repository';
import type { Category, Transaction, Wallet } from '@/types/domain';

export type DailyView = {
  transactions: Transaction[];
  categories: Category[];
  wallets: Wallet[];
};

/** Read model layar Daily: transaksi satu bulan kalender + kategori + Dompet. */
export async function readDailyView(database: SQLiteDatabase, month: string): Promise<DailyView> {
  const [transactions, categories, wallets] = await Promise.all([
    getDatabaseTransactionsInMonth(database, month),
    getDatabaseTransactionCategories(database),
    getWallets(database),
  ]);
  return { transactions, categories, wallets };
}
