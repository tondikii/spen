import { todayISO } from '@/utils/date';
import type { BudgetPeriod } from '@/types/domain';

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
}

function addMonths(date: string, months: number, anchorDay?: number): string {
  const [year = NaN, month = NaN, day = NaN] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const effectiveDay = Math.min(
    anchorDay ?? day,
    daysInMonth(value.getUTCFullYear(), value.getUTCMonth() + 1),
  );
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;
}

/**
 * Batas Periode Anggaran (ADR-0007): satu hari mulai bulanan 1–31; bila
 * tanggal itu tak ada pada suatu bulan, dipakai hari terakhir bulan itu.
 * endDate selalu sehari sebelum awal periode berikutnya.
 */
export function periodBounds(startDay: number, today = todayISO()) {
  const safeDay = Math.min(Math.max(Math.trunc(startDay), 1), 31);
  const [currentYear = NaN, currentMonth = NaN] = today.slice(0, 7).split('-').map(Number);
  let start = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(Math.min(safeDay, daysInMonth(currentYear, currentMonth))).padStart(2, '0')}`;
  if (today < start) start = addMonths(start, -1, safeDay);
  const nextStart = addMonths(start, 1, safeDay);
  const [year = NaN, month = NaN, day = NaN] = nextStart.split('-').map(Number);
  const end = new Date(Date.UTC(year, month - 1, day - 1, 12));
  return {
    startDate: start,
    endDate: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`,
  };
}

/** Maps a `budget_periods` row onto the BudgetPeriod domain type. */
export function periodFromRow(row: {
  id: number | string;
  start_date: string;
  end_date: string;
}): BudgetPeriod {
  return {
    id: `period-${row.id}`,
    startDate: row.start_date,
    endDate: row.end_date,
    durationMonths: 1,
  };
}
