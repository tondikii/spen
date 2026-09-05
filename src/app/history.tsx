import HistoryScreen from '@/components/history-screen';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DataState } from '@/components/screen-skeleton';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';
import { getHistoryOverview } from '@/features/report';

export default function HistoryRoute() {
  const { t } = useTranslation();
  const database = useAppDatabase();
  const read = useCallback(() => getHistoryOverview(database), [database]);
  const { data, error, retry } = useFocusedRead(read, t('common.historyLoadError'));
  if (error)
    return (
      <DataState
        kind="error"
        title={t('common.historyNotReady')}
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
        title={t('common.loadingHistory')}
        description={t('common.loadingHistoryCopy')}
      />
    );
  return <HistoryScreen {...data} />;
}
