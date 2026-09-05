import DailyTransactionsScreen from '@/components/daily-transactions-screen';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getDatabaseTransactionCategories, getDatabaseTransactions } from '@/features/transactions';
import { getWallets } from '@/features/wallet';
import { DataState } from '@/components/screen-skeleton';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function DailyRoute() {
  const { t } = useTranslation();
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
  const { data, error, retry } = useFocusedRead(read, t('common.dailyNotReady'));
  if (error)
    return (
      <DataState
        kind="error"
        title={t('common.transactionsNotReady')}
        description={t('errors.unknown')}
        onRetry={() => {
          retry();
        }}
      />
    );
  if (!data)
    return (
      <DataState
        kind="loading"
        title={t('common.loadingTransactions')}
        description={t('common.loadingDailyTransactionsCopy')}
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
