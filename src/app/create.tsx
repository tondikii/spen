import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { TransactionForm } from '@/components/transaction-form';
import { DataState } from '@/components/screen-skeleton';
import { saveToGoal } from '@/services/goal-service';
import { archiveDatabaseCategory, deleteDatabaseTransaction, getDatabaseTransactionCategories, getDatabaseTransactions, saveDatabaseCategory, saveDatabaseTransaction } from '@/services/transaction-service';
import { getDatabasePlanView } from '@/services/plan-service';
import { getWallets } from '@/services/wallet-service';
import type { Category, Transaction, TransactionType, Wallet } from '@/types/domain';
import { retryDatabaseRead } from '@/services/database-read-retry';

export default function CreateTransactionScreen() {
  const { transactionId, goalId, type, categoryId, amount, walletId, toWalletId, lockedToWalletId } = useLocalSearchParams<{ transactionId?: string; goalId?: string; type?: TransactionType; categoryId?: string; amount?: string; walletId?: string; toWalletId?: string; lockedToWalletId?: string }>();
  const database = useSQLiteContext();
  const [data, setData] = useState<{ wallets: Wallet[]; categories: Category[]; transactions: Transaction[]; allocationLimit: number } | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    setData(null);
    setError('');
    void retryDatabaseRead(() => Promise.all([getWallets(database), getDatabaseTransactionCategories(database), getDatabaseTransactions(database), getDatabasePlanView(database)])).then(([wallets, categories, transactions, planView]) => {
      if (!cancelled) {
        const selectedCategory = categoryId;
        const allocationLimit = selectedCategory
          ? planView.plan.expenseItems
            .filter((item) => item.categoryId === selectedCategory)
            .reduce((sum, item) => sum + item.targetAmount, 0)
          : 0;
        setData({ wallets, categories, transactions, allocationLimit });
        setError('');
      }
    }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Form transaksi tidak dapat dimuat.'); });
    return () => {
      cancelled = true;
      setData(null);
    };
  }, [categoryId, database, retry]));

  if (error) return <DataState kind="error" title="Transaksi belum siap" description={error} onRetry={() => { setError(''); setData(null); setRetry((value) => value + 1); }} />;
  if (!data) return <DataState kind="loading" title="Memuat transaksi" description="Menyiapkan Wallet dan kategori." />;
  const transaction = data.transactions.find((item) => item.id === transactionId);

  return <TransactionForm
    mode={transaction ? 'edit' : 'create'}
    transaction={transaction}
    initialType={type === 'income' || type === 'expense' || type === 'transfer' ? type : undefined}
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
    onSave={async (draft) => { if (goalId && draft.type === 'transfer' && draft.walletId) await saveToGoal(database, goalId, draft.walletId, draft.amount, draft.date, draft.time); else await saveDatabaseTransaction(database, draft, transaction?.id); router.back(); }}
    onDelete={transaction ? async () => { await deleteDatabaseTransaction(database, transaction.id); router.back(); } : undefined}
    onCategorySave={(category) => saveDatabaseCategory(database, category)}
    onCategoryArchive={(category) => archiveDatabaseCategory(database, category.id)}
  />;
}
