import type { SQLiteDatabase } from 'expo-sqlite';

import { AppError } from '@/utils/app-error';
import { todayISO } from '@/utils/date';
import { periodBounds } from '@/utils/domain/period';
import type { PeriodRow } from '@/types/db-rows';

/**
 * Resolusi periode & plan anggaran aktif (ADR-0007/ADR-0009): baca/simpan
 * `settings.budget_start_day`, lalu pastikan `budget_periods` + `budget_plans`
 * untuk rentang periode berjalan sudah ada (get-or-create dalam satu transaksi
 * eksklusif). Tidak menyentuh item plan. Kedua fungsi tetap diekspor lewat
 * `plan-repository.ts` agar API publik `src/features/plan` tidak berubah.
 */

const PERIOD_BY_RANGE_SQL =
  'SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE start_date = ? AND end_date = ? LIMIT 1;';
const PERIOD_BY_ID_SQL =
  'SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE id = ?;';
const PLAN_BY_PERIOD_SQL = 'SELECT id FROM budget_plans WHERE budget_period_id = ? LIMIT 1;';
const INSERT_PERIOD_SQL =
  'INSERT INTO budget_periods (start_date, end_date, duration_months) VALUES (?, ?, 1);';
const INSERT_PLAN_SQL = 'INSERT INTO budget_plans (budget_period_id) VALUES (?);';

/** Ambil atau buat periode dan plan untuk satu rentang tanggal (dalam transaksi eksklusif). */
async function getOrCreatePeriodPlan(
  transaction: SQLiteDatabase,
  bounds: { startDate: string; endDate: string },
): Promise<{ periodId: number; planId: number }> {
  const period = await transaction.getFirstAsync<PeriodRow>(
    PERIOD_BY_RANGE_SQL,
    bounds.startDate,
    bounds.endDate,
  );
  const periodId =
    period?.id ??
    (await transaction.runAsync(INSERT_PERIOD_SQL, bounds.startDate, bounds.endDate))
      .lastInsertRowId;
  const plan = await transaction.getFirstAsync<{ id: number }>(PLAN_BY_PERIOD_SQL, periodId);
  const planId =
    plan?.id ?? (await transaction.runAsync(INSERT_PLAN_SQL, periodId)).lastInsertRowId;
  return { periodId, planId };
}

/**
 * Memastikan plan anggaran aktif untuk tanggal `today` sudah ada: satu periode
 * dan satu plan per rentang tanggal. Mengembalikan baris periode, id plan, dan
 * start-day yang tersimpan di settings.
 */
export async function ensureActiveBudgetPlan(database: SQLiteDatabase, today = todayISO()) {
  let planId = 0;
  let periodId = 0;
  let startDay = 1;
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const setting = await transaction.getFirstAsync<{ budget_start_day: number }>(
      'SELECT budget_start_day FROM settings WHERE id = 1 LIMIT 1;',
    );
    startDay = setting?.budget_start_day ?? 1;
    const resolved = await getOrCreatePeriodPlan(transaction, periodBounds(startDay, today));
    periodId = resolved.periodId;
    planId = resolved.planId;
  });
  const period = await database.getFirstAsync<PeriodRow>(PERIOD_BY_ID_SQL, periodId);
  if (!period) throw new AppError('storage');
  return { period, planId, startDay };
}

export async function getDatabaseActiveBudgetPeriod(database: SQLiteDatabase, today = todayISO()) {
  const setting = await database.getFirstAsync<{ budget_start_day: number }>(
    'SELECT budget_start_day FROM settings WHERE id = 1 LIMIT 1;',
  );
  const bounds = periodBounds(setting?.budget_start_day ?? 1, today);
  return database.getFirstAsync<PeriodRow>(
    'SELECT id, start_date, end_date, duration_months FROM budget_periods WHERE start_date = ? AND end_date = ? LIMIT 1;',
    bounds.startDate,
    bounds.endDate,
  );
}

/**
 * Mengganti `settings.budget_start_day` lalu menyiapkan periode dan plan untuk
 * rentang baru yang dihasilkan start-day tersebut.
 */
export async function setBudgetPeriodStartDay(
  database: SQLiteDatabase,
  startDay: number,
  today = todayISO(),
) {
  const bounds = periodBounds(startDay, today);
  let periodId = 0;
  let planId = 0;
  const safeStartDay = Math.min(Math.max(Math.trunc(startDay), 1), 31);
  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      "INSERT OR IGNORE INTO settings (id, currency, theme_mode, budget_start_day) VALUES (1, 'IDR', 'light', ?);",
      safeStartDay,
    );
    await transaction.runAsync(
      'UPDATE settings SET budget_start_day = ? WHERE id = 1;',
      safeStartDay,
    );
    const resolved = await getOrCreatePeriodPlan(transaction, bounds);
    periodId = resolved.periodId;
    planId = resolved.planId;
  });
  return {
    period: await database.getFirstAsync<PeriodRow>(PERIOD_BY_ID_SQL, periodId),
    planId,
    startDay: safeStartDay,
  };
}
