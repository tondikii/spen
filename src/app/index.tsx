import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import HomeScreen from '@/components/home-screen';
import type { Category, Transaction, Wallet } from '@/types/domain';
import { archiveWallet, createWallet, getWallets, updateWallet } from '@/services/wallet-service';
import { getDatabaseTransactionCategories, getDatabaseTransactions } from '@/services/transaction-service';

export default function HomeRoute() {
  const router = useRouter();
  const database = useSQLiteContext();
  const [data, setData] = useState<{ wallets: Wallet[]; categories: Category[]; transactions: Transaction[] } | null>(null);

  const loadData = useCallback(async () => {
    const [wallets, categories, transactions] = await Promise.all([
      getWallets(database),
      getDatabaseTransactionCategories(database),
      getDatabaseTransactions(database),
    ]);
    setData({ wallets, categories, transactions });
  }, [database]);

  useFocusEffect(useCallback(() => {
    void loadData();
  }, [loadData]));

  const refreshData = async () => loadData();

  if (!data) return null;

  return <HomeScreen
    wallets={data.wallets}
    transactions={data.transactions}
    categories={data.categories}
    onWalletSave={async (wallet, name, balance) => {
      if (wallet) await updateWallet(database, wallet.id, name, balance);
      else await createWallet(database, name, balance);
      await refreshData();
    }}
    onWalletArchive={async (wallet) => {
      await archiveWallet(database, wallet.id);
      await refreshData();
    }}
    onTransactionPress={(transaction) => router.push({ pathname: '/create', params: { transactionId: transaction.id } })}
    onDailyPress={() => router.push('/daily' as never)}
  />;
}
