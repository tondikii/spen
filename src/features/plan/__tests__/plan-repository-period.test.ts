import type { SQLiteDatabase } from 'expo-sqlite';

import { ensureActiveBudgetPlan, setBudgetPeriodStartDay } from '@/features/plan';
import { periodBounds } from '@/utils/domain/period';

import {
  createDatabase,
  getDatabasePlanView,
  prepareDatabase,
  type TempSQLite,
} from './plan-repository-test-db';

describe('database plan period', () => {
  let database: SQLiteDatabase;
  let sqlite: TempSQLite;

  beforeEach(async () => {
    ({ database, sqlite } = createDatabase());
    await prepareDatabase(database, sqlite);
  });

  afterEach(() => sqlite.close());

  it('creates one active global plan and rolls over to a new period', async () => {
    const first = await ensureActiveBudgetPlan(database, '2026-09-10');
    expect(first.period.start_date).toBe('2026-09-01');
    expect(first.period.end_date).toBe('2026-09-30');

    const rolled = await setBudgetPeriodStartDay(database, 5, '2026-09-10');
    expect(rolled.period?.start_date).toBe('2026-09-05');
    expect(rolled.period?.end_date).toBe('2026-10-04');
    expect(rolled.planId).not.toBe(first.planId);
    expect(
      await database.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) AS count FROM budget_plans;',
      ),
    ).toEqual({ count: 2 });
  });

  it('supports anchor day 31 while clamping shorter months and returning to 31', () => {
    expect(periodBounds(31, '2026-02-28')).toEqual({
      startDate: '2026-02-28',
      endDate: '2026-03-30',
    });
    expect(periodBounds(31, '2026-03-31')).toEqual({
      startDate: '2026-03-31',
      endDate: '2026-04-29',
    });
  });

  it('persists the selected start day and reuses the matching historical period', async () => {
    await setBudgetPeriodStartDay(database, 5, '2026-09-10');
    const nextPeriod = await ensureActiveBudgetPlan(database, '2026-10-10');
    expect(nextPeriod.period.start_date).toBe('2026-10-05');
    expect(nextPeriod.period.end_date).toBe('2026-11-04');

    const firstPeriod = await setBudgetPeriodStartDay(database, 1, '2026-09-10');
    expect(firstPeriod.period?.start_date).toBe('2026-09-01');
    expect(firstPeriod.period?.end_date).toBe('2026-09-30');
    expect((await getDatabasePlanView(database, '2026-09-10')).period.startDate).toBe('2026-09-01');
  });
});
