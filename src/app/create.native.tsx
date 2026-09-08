import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { DataState } from '@/components/screen-skeleton';
import {
  TransactionForm,
  archiveTransactionEntryCategory,
  deleteTransactionEntry,
  readTransactionEntryView,
  saveTransactionEntry,
  saveTransactionEntryCategory,
} from '@/features/transaction-entry';
import type { TransactionType } from '@/types/domain';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function CreateTransactionScreen() {
  const { t } = useTranslation();
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
    () => readTransactionEntryView(database, categoryId, transactionId),
    [categoryId, database, transactionId],
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
  const { data, error, retry } = useFocusedRead(read, t('common.setupNotReady'), resourceKey);

  if (error)
    return (
      <DataState
        kind="error"
        title={t('common.transactionsNotReady')}
        description={t('errors.unknown')}
        onRetry={() => {
          retry();
        }}
      />
    );
  if (!data)
    return (
      <DataState
        kind="loading"
        title={t('common.loadingTransactions')}
        description={t('common.loadingTransactionsCopy')}
      />
    );

  const transaction = data.transaction ?? undefined;
  const initialCategory = categoryId
    ? data.categories.find((item) => item.id === categoryId)
    : undefined;

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
      initialSystemCategoryKey={initialCategory?.systemKey ?? undefined}
      wallets={data.wallets}
      categories={data.categories}
      existingTransactions={data.incomeTransactions}
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
