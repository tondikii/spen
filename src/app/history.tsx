import HistoryScreen from '@/components/history-screen';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getDatabaseTransactionCategories, getDatabaseTransactions } from '@/services/transaction-service';
import { getWallets } from '@/services/wallet-service';
import type { Category, Transaction, Wallet } from '@/types/domain';

export default function HistoryRoute() {
  const database = useSQLiteContext();
  const [data, setData] = useState<{ transactions: Transaction[]; categories: Category[]; wallets: Wallet[] } | null>(null);
  const load = useCallback(async () => { const [transactions, categories, wallets] = await Promise.all([getDatabaseTransactions(database), getDatabaseTransactionCategories(database), getWallets(database, true)]); setData({ transactions, categories, wallets }); }, [database]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (!data) return null;
  return <HistoryScreen transactions={data.transactions} categories={data.categories} wallets={data.wallets} />;
}
