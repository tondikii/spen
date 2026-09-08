import ReportScreen from '@/components/report-screen';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readReportView } from '@/features/report';
import { setBudgetPeriodStartDay } from '@/features/budget';
import { DataState } from '@/components/screen-skeleton';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function ReportRoute() {
  const { t } = useTranslation();
  const database = useAppDatabase();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>();
  const read = useCallback(
    () => readReportView(database, undefined, selectedPeriodId),
    [database, selectedPeriodId],
  );
  const {
    data: reportView,
    error,
    retry,
  } = useFocusedRead(read, t('common.reportLoadError'), selectedPeriodId ?? 'active');

  if (error)
    return (
      <DataState
        kind="error"
        title={t('common.reportNotReady')}
        description={t('errors.unknown')}
        onRetry={() => {
          retry();
        }}
      />
    );
  if (!reportView)
    return (
      <DataState
        kind="loading"
        title={t('common.loadingReport')}
        description={t('common.loadingReportCopy')}
      />
    );
  return (
    <ReportScreen
      reportView={reportView}
      onPeriodStartDayChange={async (day) => {
        await setBudgetPeriodStartDay(database, day);
        await retry();
      }}
      onRangeChange={() => undefined}
      onPeriodChange={(periodId) => {
        setSelectedPeriodId(periodId);
      }}
    />
  );
}
