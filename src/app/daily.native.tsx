import { DailyTransactionsScreen, readDailyView } from '@/features/daily';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { todayISO } from '@/utils/date';
import { DataState } from '@/components/feedback/data-state';
import useAppDatabase from '@/providers/database-provider';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function DailyRoute() {
  const { t } = useTranslation();
  const database = useAppDatabase();
  const [month, setMonth] = useState(() => todayISO().slice(0, 7));
  const read = useCallback(() => readDailyView(database, month), [database, month]);
  const { data, error, retry } = useFocusedRead(read, t('common.dailyNotReady'), month);
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
  return (
    <DailyTransactionsScreen
      transactions={data.transactions}
      categories={data.categories}
      wallets={data.wallets}
      today={todayISO()}
      loadedMonth={month}
      onMonthChange={setMonth}
    />
  );
}
