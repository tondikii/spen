import DailyTransactionsScreen from '@/components/daily-transactions-screen';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  getDatabaseTransactionCategories,
  getDatabaseTransactions,
} from '@/services/transaction-service';
import { getWallets } from '@/services/wallet-service';
import type { Category, Transaction, Wallet } from '@/types/domain';
import { DataState } from '@/components/screen-skeleton';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function DailyRoute() {
  const database = useAppDatabase();
  const read = useCallback(
    () =>
      Promise.all([
        getDatabaseTransactions(database),
        getDatabaseTransactionCategories(database),
        getWallets(database),
      ]),
    [database],
  );
  const { data, error, retry } = useFocusedRead(read, 'Transaksi harian tidak dapat dimuat.');
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
        description="Mengambil catatan hari ini."
      />
    );
  const [transactions, categories, wallets] = data;
  return (
    <DailyTransactionsScreen
      transactions={transactions}
      categories={categories}
      wallets={wallets}
      today={getLocalDate()}
    />
  );
}

function getLocalDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
