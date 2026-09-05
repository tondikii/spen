import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import HomeScreen from '@/components/home-screen';
import { DataState } from '@/components/screen-skeleton';
import {
  archiveWallet,
  createWallet,
  getWalletOverview,
  restoreWallet,
  updateWallet,
} from '@/features/wallet';
import { getDatabaseTransactionCategories, getDatabaseTransactions } from '@/features/transactions';
import { getDatabasePlanView } from '@/features/budget';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function HomeRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const database = useAppDatabase();
  const read = useCallback(
    () =>
      Promise.all([
        getWalletOverview(database),
        getDatabaseTransactionCategories(database),
        getDatabaseTransactions(database),
        getDatabasePlanView(database),
      ]),
    [database],
  );
  const { data: loaded, error, retry } = useFocusedRead(read, t('common.homeLoadError'));
  const data = loaded
    ? {
        wallets: loaded[0].active,
        archivedWallets: loaded[0].archived,
        categories: loaded[1],
        transactions: loaded[2],
        plan: loaded[3],
      }
    : null;
  const loadData = async () => retry();
  const refreshData = async () => loadData();

  if (error)
    return (
      <DataState
        kind="error"
        title={t('common.homeNotReady')}
        description={t('errors.unknown')}
        onRetry={() => {
          void loadData();
        }}
      />
    );
  if (!data)
    return (
      <DataState
        kind="loading"
        title={t('common.loadingHome')}
        description={t('common.loadingHomeCopy')}
      />
    );

  return (
    <HomeScreen
      wallets={data.wallets.filter((wallet) => !wallet.archived)}
      archivedWallets={data.archivedWallets}
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
      onWalletRestore={async (wallet) => {
        await restoreWallet(database, wallet.id);
        await refreshData();
      }}
      onTransactionPress={(transaction) =>
        router.push({ pathname: '/create', params: { transactionId: transaction.id } })
      }
      onDailyPress={() => router.push('/daily' as never)}
      onPlanPress={() => router.push('/plan' as never)}
    />
  );
}
