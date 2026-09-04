import HistoryScreen from '@/components/history-screen';
import { useCallback } from 'react';
import { DataState } from '@/components/screen-skeleton';
import useAppDatabase from '@/hooks/use-app-database';
import { useFocusedRead } from '@/hooks/use-focused-read';
import { getHistoryOverview } from '@/services/report-history-service';

export default function HistoryRoute() {
  const database = useAppDatabase();
  const read = useCallback(() => getHistoryOverview(database), [database]);
  const { data, error, retry } = useFocusedRead(read, 'Riwayat tidak dapat dimuat.');
  if (error)
    return (
      <DataState
        kind="error"
        title="Riwayat belum siap"
        description={error}
        onRetry={() => {
          retry();
        }}
      />
    );
  if (!data)
    return (
      <DataState
        kind="loading"
        title="Memuat riwayat"
        description="Mengambil seluruh catatan transaksi."
      />
    );
  return <HistoryScreen {...data} />;
}
