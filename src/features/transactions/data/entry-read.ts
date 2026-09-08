import type { SQLiteDatabase } from 'expo-sqlite';

import { parsePrefixedId } from '@/lib/db-helpers';
import { ensureActiveBudgetPlan } from '@/features/plan';
import {
  getDatabaseIncomeTransactions,
  getDatabaseTransaction,
  getDatabaseTransactionCategories,
} from './transaction-repository';
import { getWallets } from '@/features/wallet';
import type { Category, Transaction, Wallet } from '@/types/domain';

export type TransactionEntryView = {
  wallets: Wallet[];
  categories: Category[];
  transaction: Transaction | null;
  incomeTransactions: Transaction[];
  allocationLimit: number;
};

/**
 * Read model form transaksi: Dompet, kategori, transaksi yang diedit,
 * riwayat Pendapatan untuk peringatan duplikat, dan target Pengeluaran
 * kategori awal (allocationLimit) langsung dari SQL.
 */
export async function readTransactionEntryView(
  database: SQLiteDatabase,
  categoryId?: string,
  transactionId?: string,
): Promise<TransactionEntryView> {
  const active = await ensureActiveBudgetPlan(database);
  const [wallets, categories, transaction, incomeTransactions, allocationLimit] = await Promise.all(
    [
      getWallets(database),
      getDatabaseTransactionCategories(database),
      transactionId ? getDatabaseTransaction(database, transactionId) : Promise.resolve(null),
      getDatabaseIncomeTransactions(database),
      categoryId
        ? database
            .getFirstAsync<{ total: number }>(
              `SELECT COALESCE(SUM(target_amount), 0) AS total FROM expense_items
               WHERE budget_plan_id = ? AND category_id = ?;`,
              active.planId,
              parsePrefixedId(categoryId, ['category-'], `ID kategori tidak valid: ${categoryId}`),
            )
            .then((row) => row?.total ?? 0)
        : Promise.resolve(0),
    ],
  );
  return { wallets, categories, transaction, incomeTransactions, allocationLimit };
}
