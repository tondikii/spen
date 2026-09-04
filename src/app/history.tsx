import HistoryScreen from '@/components/history-screen';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  getDatabaseTransactionCategories,
  getDatabaseTransactions,
} from '@/services/transaction-service';
import { getWallets } from '@/services/wallet-service';
import type { Category, Transaction, Wallet } from '@/types/domain';
import { DataState } from '@/components/screen-skeleton';
import { retryDatabaseRead } from '@/services/database-read-retry';
import useAppDatabase from '@/hooks/use-app-database';

export default function HistoryRoute() {
  const database = useAppDatabase();
  const [data, setData] = useState<{
    transactions: Transaction[];
    categories: Category[];
    wallets: Wallet[];
  } | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      const [transactions, categories, wallets] = await retryDatabaseRead(() =>
        Promise.all([
          getDatabaseTransactions(database),
          getDatabaseTransactionCategories(database),
          getWallets(database, true),
        ]),
      );
      setData({ transactions, categories, wallets });
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Riwayat tidak dapat dimuat.');
    }
  }, [database]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  if (error)
    return (
      <DataState
        kind="error"
        title="Riwayat belum siap"
        description={error}
        onRetry={() => {
          void load();
        }}
      />
    );
  if (!data)
    return (
      <DataState
        kind="loading"
        title="Memuat riwayat"
        description="Mengambil seluruh catatan transaksi."
      />
    );
  return (
    <HistoryScreen
      transactions={data.transactions}
      categories={data.categories}
      wallets={data.wallets}
    />
  );
}
