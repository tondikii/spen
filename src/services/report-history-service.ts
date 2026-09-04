import type { SQLiteDatabase } from 'expo-sqlite';

import { getDatabaseReportView } from '@/services/report-service';
import {
  getDatabaseTransactionCategories,
  getDatabaseTransactions,
} from '@/services/transaction-service';
import { getWallets } from '@/services/wallet-service';

export const getReportOverview = getDatabaseReportView;

export async function getHistoryOverview(database: SQLiteDatabase) {
  const [transactions, categories, wallets] = await Promise.all([
    getDatabaseTransactions(database),
    getDatabaseTransactionCategories(database),
    getWallets(database, true),
  ]);
  return { transactions, categories, wallets };
}
