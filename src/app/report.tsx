import ReportScreen from '@/components/report-screen';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getReportOverview } from '@/features/report';
import { setBudgetPeriodStartDay } from '@/features/budget';
import { DataState } from '@/components/screen-skeleton';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function ReportRoute() {
  const { t } = useTranslation();
  const database = useAppDatabase();
  const [months, setMonths] = useState(3);
  const read = useCallback(() => getReportOverview(database, months), [database, months]);
  const {
    data: reportView,
    error,
    retry,
  } = useFocusedRead(read, t('common.reportLoadError'), String(months));

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
      onRangeChange={(nextMonths) => {
        setMonths(nextMonths);
      }}
      onCategoryPress={(expense, period) =>
        router.push({
          pathname: '/history',
          params: {
            categoryId: expense.categoryId,
            categoryName: expense.name,
            startDate: period.startDate,
            endDate: period.endDate,
          },
        } as never)
      }
    />
  );
}
