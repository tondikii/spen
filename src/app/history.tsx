import HistoryScreen from '@/components/history-screen';
import { useCallback } from 'react';
import {
  getDatabaseTransactionCategories,
  getDatabaseTransactions,
} from '@/services/transaction-service';
import { getWallets } from '@/services/wallet-service';
import { DataState } from '@/components/screen-skeleton';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function HistoryRoute() {
  const database = useAppDatabase();
  const read = useCallback(
    () =>
      Promise.all([
        getDatabaseTransactions(database),
        getDatabaseTransactionCategories(database),
        getWallets(database, true),
      ]),
    [database],
  );
  const { data, error, retry } = useFocusedRead(read, 'Riwayat tidak dapat dimuat.');
  if (error)
    return (
      <DataState
        kind="error"
        title="Riwayat belum siap"
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
        title="Memuat riwayat"
        description="Mengambil seluruh catatan transaksi."
      />
    );
  const [transactions, categories, wallets] = data;
  return <HistoryScreen transactions={transactions} categories={categories} wallets={wallets} />;
}
