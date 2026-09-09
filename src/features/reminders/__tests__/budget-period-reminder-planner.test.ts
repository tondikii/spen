import { planBudgetPeriodReminders } from '@/features/reminders';
import { periodBounds } from '@/utils/domain/period';

describe('BudgetPeriodReminderPlanner', () => {
  const period = {
    id: 'budget-period-31',
    startDate: '2026-01-31',
    endDate: '2026-02-27',
  };

  it('menjadwalkan awal periode dan review tiga hari sebelum berakhir', () => {
    const plan = planBudgetPeriodReminders({
      enabled: true,
      period,
      now: new Date(2026, 0, 30, 12, 0),
      locale: 'id',
    });

    expect(plan).toHaveLength(2);
    expect(plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          identifier: 'spen:budget-period:start:budget-period-31:2026-01-31',
          title: 'Awal Periode Anggaran',
          triggerAt: new Date(2026, 0, 31, 9, 0),
          data: expect.objectContaining({ reminderKind: 'budget-period', route: '/plan' }),
        }),
        expect.objectContaining({
          identifier: 'spen:budget-period:review:budget-period-31:2026-02-24',
          title: 'Review Rencana Anggaran',
          triggerAt: new Date(2026, 1, 24, 19, 0),
        }),
      ]),
    );
  });

  it('melewati kejadian yang sudah lewat tanpa catch-up dan mengikuti locale', () => {
    const plan = planBudgetPeriodReminders({
      enabled: true,
      period,
      now: new Date(2026, 1, 25, 12, 0),
      locale: 'en',
    });

    expect(plan).toEqual([]);
  });

  it('menangani lintas tahun dan tidak membuat duplikat saat dihitung ulang', () => {
    const input = {
      enabled: true,
      period: {
        id: 'budget-period-new-year',
        startDate: '2026-12-31',
        endDate: '2027-01-30',
      },
      now: new Date(2026, 11, 30, 12, 0),
      locale: 'en' as const,
    };
    const first = planBudgetPeriodReminders(input);
    const second = planBudgetPeriodReminders(input);

    expect(first.map((item) => item.identifier)).toEqual([
      'spen:budget-period:start:budget-period-new-year:2026-12-31',
      'spen:budget-period:review:budget-period-new-year:2027-01-27',
    ]);
    expect(second.map((item) => item.identifier)).toEqual(first.map((item) => item.identifier));
  });

  it('mengikuti anchor 31 saat bulan berikutnya hanya memiliki 28 hari', () => {
    const bounds = periodBounds(31, '2026-01-31');
    const plan = planBudgetPeriodReminders({
      enabled: true,
      period: { id: 'budget-period-short-month', ...bounds },
      now: new Date(2026, 0, 30, 12, 0),
      locale: 'id',
    });

    expect(bounds).toEqual({ startDate: '2026-01-31', endDate: '2026-02-27' });
    expect(plan.map((item) => item.identifier)).toEqual([
      'spen:budget-period:start:budget-period-short-month:2026-01-31',
      'spen:budget-period:review:budget-period-short-month:2026-02-24',
    ]);
  });

  it('tidak menghasilkan jadwal ketika toggle Periode Anggaran mati', () => {
    expect(
      planBudgetPeriodReminders({ enabled: false, period, now: new Date(), locale: 'id' }),
    ).toEqual([]);
  });
});
