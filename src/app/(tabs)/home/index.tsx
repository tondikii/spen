import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { DataState } from '@/components/feedback/data-state';
import HomeScreen, { readHomeView } from '@/features/home';
import { archiveWallet, createWallet, restoreWallet, updateWallet } from '@/features/wallet';
import useAppDatabase from '@/providers/database-provider';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function HomeRoute() {
  const { t } = useTranslation();
  const router = useRouter();
  const database = useAppDatabase();
  const read = useCallback(() => readHomeView(database), [database]);
  const { data, error, retry } = useFocusedRead(read, t('common.homeLoadError'));
  const refreshData = useCallback(async () => retry(), [retry]);

  if (error)
    return (
      <DataState
        kind="error"
        title={t('common.homeNotReady')}
        description={t('errors.unknown')}
        onRetry={() => {
          void refreshData();
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
      wallets={data.wallets}
      archivedWallets={data.archivedWallets}
      transactions={data.recentTransactions}
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
      onWalletRestore={async (wallet) => {
        await restoreWallet(database, wallet.id);
        await refreshData();
      }}
      onTransactionPress={(transaction) =>
        router.push({ pathname: '/create', params: { transactionId: transaction.id } })
      }
      onDailyPress={() => router.push('/home/daily')}
    />
  );
}
