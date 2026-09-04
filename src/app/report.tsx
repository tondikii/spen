import ReportScreen from '@/components/report-screen';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { getReportOverview } from '@/features/report';
import { DataState } from '@/components/screen-skeleton';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';

export default function ReportRoute() {
  const database = useAppDatabase();
  const [months, setMonths] = useState(3);
  const read = useCallback(() => getReportOverview(database, months), [database, months]);
  const {
    data: reportView,
    error,
    retry,
  } = useFocusedRead(read, 'Laporan tidak dapat dimuat.', String(months));

  if (error)
    return (
      <DataState
        kind="error"
        title="Laporan belum siap"
        description={error}
        onRetry={() => {
          retry();
        }}
      />
    );
  if (!reportView)
    return (
      <DataState
        kind="loading"
        title="Memuat Laporan"
        description="Mengolah ringkasan Budget period."
      />
    );
  return (
    <ReportScreen
      reportView={reportView}
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
