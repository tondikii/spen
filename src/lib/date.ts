/**
 * Central date helpers for Spen.
 * All dates use local calendar day (not UTC midnight) via `YYYY-MM-DD`.
 */

export function todayISO(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** @deprecated use todayISO — kept for backwards compat */
export const dateOnly = todayISO;

/** @deprecated use todayISO — kept for backwards compat */
export const getLocalDateInput = todayISO;

/** @deprecated use todayISO — kept for backwards compat */
export function localDate(): string {
  return todayISO();
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0, 12)).getUTCDate();
}

function addMonths(date: string, months: number, anchorDay?: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const effectiveDay = Math.min(anchorDay ?? day, daysInMonth(value.getUTCFullYear(), value.getUTCMonth() + 1));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;
}

export function periodBounds(startDay: number, today = todayISO()) {
  const safeDay = Math.min(Math.max(Math.trunc(startDay), 1), 31);
  const [currentYear, currentMonth] = today.slice(0, 7).split('-').map(Number);
  let start = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(Math.min(safeDay, daysInMonth(currentYear, currentMonth))).padStart(2, '0')}`;
  if (today < start) start = addMonths(start, -1, safeDay);
  const nextStart = addMonths(start, 1, safeDay);
  const [year, month, day] = nextStart.split('-').map(Number);
  const end = new Date(Date.UTC(year, month - 1, day - 1, 12));
  return {
    startDate: start,
    endDate: `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, '0')}-${String(end.getUTCDate()).padStart(2, '0')}`,
  };
}

export function isValidTransactionDate(value: string, today = todayISO()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12));
  const normalized = `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-${String(parsed.getUTCDate()).padStart(2, '0')}`;
  return normalized === value && value <= today;
}
