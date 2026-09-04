import type { SQLiteDatabase } from 'expo-sqlite';
import { saveToGoal } from '@/services/goal-service';
import {
  archiveDatabaseCategory,
  deleteDatabaseTransaction,
  getDatabaseTransactionCategories,
  getDatabaseTransactions,
  saveDatabaseCategory,
  saveDatabaseTransaction,
} from '@/services/transaction-service';
import { getWallets } from '@/services/wallet-service';
import { getDatabasePlanView } from '@/services/plan-service';
import type { Category, Transaction, TransactionDraft, Wallet } from '@/types/domain';

export type TransactionEntryData = {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  allocationLimit: number;
};

export async function getTransactionEntryData(
  database: SQLiteDatabase,
  categoryId?: string,
): Promise<TransactionEntryData> {
  const [wallets, categories, transactions, plan] = await Promise.all([
    getWallets(database),
    getDatabaseTransactionCategories(database),
    getDatabaseTransactions(database),
    getDatabasePlanView(database),
  ]);
  return {
    wallets,
    categories,
    transactions,
    allocationLimit: categoryId
      ? plan.plan.expenseItems
          .filter((item) => item.categoryId === categoryId)
          .reduce((sum, item) => sum + item.targetAmount, 0)
      : 0,
  };
}

export async function saveTransactionEntry(
  database: SQLiteDatabase,
  draft: TransactionDraft,
  transactionId?: string,
  goalId?: string,
) {
  if (goalId && draft.type === 'transfer' && draft.walletId)
    return saveToGoal(database, goalId, draft.walletId, draft.amount, draft.date, draft.time);
  return saveDatabaseTransaction(database, draft, transactionId);
}

export const deleteTransactionEntry = deleteDatabaseTransaction;
export const saveTransactionEntryCategory = saveDatabaseCategory;
export const archiveTransactionEntryCategory = archiveDatabaseCategory;
