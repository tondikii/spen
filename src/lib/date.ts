/**
 * Central date helpers for Spen.
 * All dates use local calendar day (not UTC midnight) via `YYYY-MM-DD`.
 * Period arithmetic lives in `lib/domain/period`.
 */

export function todayISO(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidTransactionDate(value: string, today = todayISO()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12));
  const normalized = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-${String(parsed.getUTCDate()).padStart(2, '0')}`;
  return normalized === value && value <= today;
}

/** Returns `value` shifted by `delta` days as a `YYYY-MM-DD` string. */
export function shiftDate(value: string, delta: number) {
  const [year, month, day] = value.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + delta, 12));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

/** Returns the `YYYY-MM` string shifted by `delta` months, rolling across years. */
export function shiftMonth(value: string, delta: number) {
  const [year, month] = value.split('-').map(Number);
  const shifted = month - 1 + delta;
  return `${year + Math.floor(shifted / 12)}-${String((shifted % 12) + 1).padStart(2, '0')}`;
}

export type CalendarDate = { date: string; inMonth: boolean };

/** Six-week (42-day) Monday-first grid covering the given `YYYY-MM` month. */
export function getCalendarDates(month: string): CalendarDate[] {
  const firstDay = `${month}-01`;
  const first = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1, 12));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const firstDate = shiftDate(firstDay, -mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = shiftDate(firstDate, index);
    return { date, inMonth: date.startsWith(month) };
  });
}

/** Seven narrow weekday labels starting Monday, formatted for `locale`. */
export function getWeekdayLabels(locale: string) {
  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(
      new Date(`2026-09-${String(7 + index).padStart(2, '0')}T12:00:00`),
    ),
  );
}

/** "September 2026"-style label for a `YYYY-MM` string. */
export function formatCalendarMonth(month: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(`${month}-01T12:00:00`),
  );
}
