import { router } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { TransactionForm } from '@/components/transaction-form';
import { archiveDatabaseCategory, deleteDatabaseTransaction, getDatabaseTransactionCategories, getDatabaseTransactions, saveDatabaseCategory, saveDatabaseTransaction } from '@/services/transaction-service';
import { getWallets } from '@/services/wallet-service';
import type { Category, Transaction, TransactionType, Wallet } from '@/types/domain';

export default function CreateTransactionScreen() {
  const { transactionId, type, categoryId, amount, walletId, toWalletId } = useLocalSearchParams<{ transactionId?: string; type?: TransactionType; categoryId?: string; amount?: string; walletId?: string; toWalletId?: string }>();
  const database = useSQLiteContext();
  const [data, setData] = useState<{ wallets: Wallet[]; categories: Category[]; transactions: Transaction[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getWallets(database), getDatabaseTransactionCategories(database), getDatabaseTransactions(database)]).then(([wallets, categories, transactions]) => {
      if (!cancelled) setData({ wallets, categories, transactions });
    });
    return () => {
      cancelled = true;
    };
  }, [database]);

  if (!data) return null;
  const transaction = data.transactions.find((item) => item.id === transactionId);

  return <TransactionForm
    mode={transaction ? 'edit' : 'create'}
    transaction={transaction}
    initialType={type === 'income' || type === 'expense' || type === 'transfer' ? type : undefined}
    initialCategoryId={categoryId}
    initialAmount={amount ? Number(amount) : undefined}
    initialWalletId={walletId}
    initialToWalletId={toWalletId}
    wallets={data.wallets}
    categories={data.categories}
    existingTransactions={data.transactions}
    onClose={() => router.back()}
    onSave={async (draft) => { await saveDatabaseTransaction(database, draft, transaction?.id); router.back(); }}
    onDelete={transaction ? async () => { await deleteDatabaseTransaction(database, transaction.id); router.back(); } : undefined}
    onCategorySave={(category) => saveDatabaseCategory(database, category)}
    onCategoryArchive={(category) => archiveDatabaseCategory(database, category.id)}
  />;
}
