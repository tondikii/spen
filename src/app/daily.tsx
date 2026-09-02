import DailyTransactionsScreen from '@/components/daily-transactions-screen';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getDatabaseTransactionCategories, getDatabaseTransactions } from '@/services/transaction-service';
import { getWallets } from '@/services/wallet-service';
import type { Category, Transaction, Wallet } from '@/types/domain';

export default function DailyRoute() {
  const database = useSQLiteContext();
  const [data, setData] = useState<{ transactions: Transaction[]; categories: Category[]; wallets: Wallet[] } | null>(null);
  const load = useCallback(async () => { const [transactions, categories, wallets] = await Promise.all([getDatabaseTransactions(database), getDatabaseTransactionCategories(database), getWallets(database)]); setData({ transactions, categories, wallets }); }, [database]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (!data) return null;
  return <DailyTransactionsScreen transactions={data.transactions} categories={data.categories} wallets={data.wallets} today={getLocalDate()} />;
}

function getLocalDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
