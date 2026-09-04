import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { TransactionForm } from '@/components/transaction-form';
import { DataState } from '@/components/screen-skeleton';
import {
  archiveTransactionEntryCategory,
  deleteTransactionEntry,
  getTransactionEntryData,
  saveTransactionEntry,
  saveTransactionEntryCategory,
} from '@/features/transactions';
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
    () => Promise.all([getTransactionEntryData(database, categoryId)]),
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
        ...loaded[0],
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
        await saveTransactionEntry(database, draft, transaction?.id, goalId);
        router.back();
      }}
      onDelete={
        transaction
          ? async () => {
              await deleteTransactionEntry(database, transaction.id);
              router.back();
            }
          : undefined
      }
      onCategorySave={(category) => saveTransactionEntryCategory(database, category)}
      onCategoryArchive={(category) => archiveTransactionEntryCategory(database, category.id)}
    />
  );
}
