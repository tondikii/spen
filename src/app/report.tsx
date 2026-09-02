import ReportScreen from '@/components/report-screen';
import { useSQLiteContext } from 'expo-sqlite';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getDatabaseReportView } from '@/services/report-service';

export default function ReportRoute() {
  const database = useSQLiteContext();
  const [reportView, setReportView] = useState<Awaited<ReturnType<typeof getDatabaseReportView>> | null>(null);
  const load = useCallback(async (months = 3) => setReportView(await getDatabaseReportView(database, months)), [database]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (!reportView) return null;
  return <ReportScreen reportView={reportView} onRangeChange={load} onCategoryPress={(expense, period) => router.push({ pathname: '/history', params: { categoryId: expense.categoryId, categoryName: expense.name, startDate: period.startDate, endDate: period.endDate } } as never)} />;
}
