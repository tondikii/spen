const MS_PER_DAY = 86_400_000;

/** Local-noon anchor so timezone offsets never shift the calendar day. */
function parseDay(value: string) {
  return new Date(`${value}T12:00:00`);
}

/** Returns `value` shifted by `delta` days as a `YYYY-MM-DD` string. */
export function shiftDate(value: string, delta: number) {
  return new Date(parseDay(value).getTime() + delta * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Returns the `YYYY-MM` string shifted by `delta` months, rolling across years. */
export function shiftMonth(value: string, delta: number) {
  const date = parseDay(value);
  const month = date.getMonth() + delta;
  const year = date.getFullYear() + Math.floor(month / 12);
  return `${year}-${String((month % 12) + 1).padStart(2, '0')}`;
}

export type CalendarDate = { date: string; inMonth: boolean };

/** Six-week (42-day) Monday-first grid covering the given `YYYY-MM` month. */
export function getCalendarDates(month: string): CalendarDate[] {
  const firstDay = `${month}-01`;
  const mondayOffset = (parseDay(firstDay).getDay() + 6) % 7;
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
    parseDay(month),
  );
}
