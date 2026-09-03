import DailyTransactionsScreen from '@/components/daily-transactions-screen';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getDatabaseTransactionCategories, getDatabaseTransactions } from '@/services/transaction-service';
import { getWallets } from '@/services/wallet-service';
import type { Category, Transaction, Wallet } from '@/types/domain';
import { DataState } from '@/components/screen-skeleton';
import { retryDatabaseRead } from '@/services/database-read-retry';

export default function DailyRoute() {
  const database = useSQLiteContext();
  const [data, setData] = useState<{ transactions: Transaction[]; categories: Category[]; wallets: Wallet[] } | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => { try { const [transactions, categories, wallets] = await retryDatabaseRead(() => Promise.all([getDatabaseTransactions(database), getDatabaseTransactionCategories(database), getWallets(database)])); setData({ transactions, categories, wallets }); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Transaksi harian tidak dapat dimuat.'); } }, [database]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (error) return <DataState kind="error" title="Transaksi belum siap" description={error} onRetry={() => { void load(); }} />;
  if (!data) return <DataState kind="loading" title="Memuat transaksi" description="Mengambil catatan hari ini." />;
  return <DailyTransactionsScreen transactions={data.transactions} categories={data.categories} wallets={data.wallets} today={getLocalDate()} />;
}

function getLocalDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
