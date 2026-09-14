import type { SQLiteDatabase } from 'expo-sqlite';

// eslint-disable-next-line no-restricted-imports -- break require cycle transactions -> goal -> transactions
import { saveToGoal } from '@/features/goal/data/goal-repository';
import {
  archiveDatabaseCategory,
  deleteDatabaseTransaction,
  saveDatabaseCategory,
  saveDatabaseTransaction,
} from './transaction-repository';
import type { TransactionDraft } from '@/types/domain';

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
