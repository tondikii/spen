import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { TransactionForm } from '@/components/transaction-form';
import { DataState } from '@/components/screen-skeleton';
import { saveToGoal } from '@/services/goal-service';
import {
  archiveDatabaseCategory,
  deleteDatabaseTransaction,
  getDatabaseTransactionCategories,
  getDatabaseTransactions,
  saveDatabaseCategory,
  saveDatabaseTransaction,
} from '@/services/transaction-service';
import { getDatabasePlanView } from '@/services/plan-service';
import { getWallets } from '@/services/wallet-service';
import type { TransactionType } from '@/types/domain';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function CreateTransactionScreen() {
  const {
    transactionId,
    goalId,
    type,
    categoryId,
    amount,
    walletId,
    toWalletId,
    lockedToWalletId,
  } = useLocalSearchParams<{
    transactionId?: string;
    goalId?: string;
    type?: TransactionType;
    categoryId?: string;
    amount?: string;
    walletId?: string;
    toWalletId?: string;
    lockedToWalletId?: string;
  }>();
  const database = useAppDatabase();
  const read = useCallback(
    () =>
      Promise.all([
        getWallets(database),
        getDatabaseTransactionCategories(database),
        getDatabaseTransactions(database),
        getDatabasePlanView(database),
      ]),
    [database],
  );
  const resourceKey = JSON.stringify({
    transactionId,
    goalId,
    type,
    categoryId,
    amount,
    walletId,
    toWalletId,
    lockedToWalletId,
  });
  const {
    data: loaded,
    error,
    retry,
  } = useFocusedRead(read, 'Form transaksi tidak dapat dimuat.', resourceKey);
  const data = loaded
    ? {
        wallets: loaded[0],
        categories: loaded[1],
        transactions: loaded[2],
        allocationLimit: categoryId
          ? loaded[3].plan.expenseItems
              .filter((item) => item.categoryId === categoryId)
              .reduce((sum, item) => sum + item.targetAmount, 0)
          : 0,
      }
    : null;

  if (error)
    return (
      <DataState
        kind="error"
        title="Transaksi belum siap"
        description={error}
        onRetry={() => {
          retry();
        }}
      />
    );
  if (!data)
    return (
      <DataState
        kind="loading"
        title="Memuat transaksi"
        description="Menyiapkan Wallet dan kategori."
      />
    );
  const transaction = data.transactions.find((item) => item.id === transactionId);

  return (
    <TransactionForm
      mode={transaction ? 'edit' : 'create'}
      transaction={transaction}
      initialType={
        type === 'income' || type === 'expense' || type === 'transfer' ? type : undefined
      }
      initialCategoryId={categoryId}
      initialAmount={amount ? Number(amount) : undefined}
      initialWalletId={walletId}
      initialToWalletId={toWalletId}
      lockedToWalletId={lockedToWalletId}
      wallets={data.wallets}
      categories={data.categories}
      existingTransactions={data.transactions}
      allocationLimit={data.allocationLimit}
      onClose={() => router.back()}
      onSave={async (draft) => {
        if (goalId && draft.type === 'transfer' && draft.walletId)
          await saveToGoal(database, goalId, draft.walletId, draft.amount, draft.date, draft.time);
        else await saveDatabaseTransaction(database, draft, transaction?.id);
        router.back();
      }}
      onDelete={
        transaction
          ? async () => {
              await deleteDatabaseTransaction(database, transaction.id);
              router.back();
            }
          : undefined
      }
      onCategorySave={(category) => saveDatabaseCategory(database, category)}
      onCategoryArchive={(category) => archiveDatabaseCategory(database, category.id)}
    />
  );
}
