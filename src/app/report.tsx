import ReportScreen from '@/components/report-screen';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { getDatabaseReportView } from '@/services/report-service';
import { DataState } from '@/components/screen-skeleton';
import { retryDatabaseRead } from '@/services/database-read-retry';
import useAppDatabase from '@/hooks/use-app-database';

export default function ReportRoute() {
  const database = useAppDatabase();
  const [reportView, setReportView] = useState<Awaited<ReturnType<typeof getDatabaseReportView>> | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async (months = 3) => { try { setReportView(await retryDatabaseRead(() => getDatabaseReportView(database, months))); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Laporan tidak dapat dimuat.'); } }, [database]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (error) return <DataState kind="error" title="Laporan belum siap" description={error} onRetry={() => { void load(); }} />;
  if (!reportView) return <DataState kind="loading" title="Memuat Laporan" description="Mengolah ringkasan Budget period." />;
  return <ReportScreen reportView={reportView} onRangeChange={load} onCategoryPress={(expense, period) => router.push({ pathname: '/history', params: { categoryId: expense.categoryId, categoryName: expense.name, startDate: period.startDate, endDate: period.endDate } } as never)} />;
}
