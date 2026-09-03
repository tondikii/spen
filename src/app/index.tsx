import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import HomeScreen from '@/components/home-screen';
import type { Category, Transaction, Wallet } from '@/types/domain';
import { DataState } from '@/components/screen-skeleton';
import { archiveWallet, createWallet, getWallets, updateWallet } from '@/services/wallet-service';
import { getDatabaseTransactionCategories, getDatabaseTransactions } from '@/services/transaction-service';
import { getDatabasePlanView } from '@/services/plan-service';
import { retryDatabaseRead } from '@/services/database-read-retry';

export default function HomeRoute() {
  const router = useRouter();
  const database = useSQLiteContext();
  const [data, setData] = useState<{ wallets: Wallet[]; categories: Category[]; transactions: Transaction[]; plan: Awaited<ReturnType<typeof getDatabasePlanView>> } | null>(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [wallets, categories, transactions, plan] = await retryDatabaseRead(() => Promise.all([getWallets(database), getDatabaseTransactionCategories(database), getDatabaseTransactions(database), getDatabasePlanView(database)]));
      setData({ wallets, categories, transactions, plan }); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Data Beranda tidak dapat dimuat.'); }
  }, [database]);

  useFocusEffect(useCallback(() => {
    void loadData();
  }, [loadData]));

  const refreshData = async () => loadData();

  if (error) return <DataState kind="error" title="Beranda belum siap" description={error} onRetry={() => { void loadData(); }} />;
  if (!data) return <DataState kind="loading" title="Memuat Beranda" description="Menyiapkan ringkasan uangmu." />;

  return <HomeScreen key={data.wallets.map((wallet) => `${wallet.id}:${wallet.balance}:${wallet.name}:${wallet.archived}`).join('|')}
    wallets={data.wallets}
    transactions={data.transactions}
    categories={data.categories}
    snapshot={data.plan.snapshot}
    period={data.plan.period}
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
    onPlanPress={() => router.push('/plan' as never)}
  />;
}
