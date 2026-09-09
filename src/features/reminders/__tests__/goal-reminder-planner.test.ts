import { planGoalReminders } from '@/features/reminders';

describe('GoalReminderPlanner', () => {
  const goal = {
    id: 'goal-7',
    name: 'Dana Darurat',
    targetAmount: 10_000_000,
    targetDate: '2026-09-20',
    walletId: 'wallet-2',
    monthlyContribution: 1_000_000,
    archived: false,
  } as const;

  it('menjadwalkan tepat tujuh hari sebelum target pada pukul 09:00', () => {
    expect(
      planGoalReminders({
        enabled: true,
        goals: [goal],
        achievedGoalIds: new Set(),
        now: new Date(2026, 8, 10, 8, 0),
        locale: 'id',
      }),
    ).toEqual([
      expect.objectContaining({
        identifier: 'spen:goal-deadline:goal-7:2026-09-13',
        title: 'Deadline Goal',
        triggerAt: new Date(2026, 8, 13, 9, 0),
        data: expect.objectContaining({
          reminderKind: 'goal-deadline',
          goalId: 'goal-7',
          route: '/plan',
        }),
      }),
    ]);
  });

  it('memakai tanggal target ketika dibuat kurang dari tujuh hari sebelum target', () => {
    const plan = planGoalReminders({
      enabled: true,
      goals: [{ ...goal, targetDate: '2026-09-15' }],
      achievedGoalIds: new Set(),
      now: new Date(2026, 8, 10, 12, 0),
      locale: 'en',
    });

    expect(plan[0]).toEqual(
      expect.objectContaining({
        identifier: 'spen:goal-deadline:goal-7:2026-09-15',
        title: 'Goal deadline',
        triggerAt: new Date(2026, 8, 15, 9, 0),
      }),
    );
  });

  it.each([
    ['tanpa target', { targetDate: null }],
    ['target hari ini', { targetDate: '2026-09-10' }],
    ['target lewat', { targetDate: '2026-09-09' }],
    ['diarsipkan', { archived: true }],
  ])('melewati Goal %s tanpa catch-up', (_label, changes) => {
    expect(
      planGoalReminders({
        enabled: true,
        goals: [{ ...goal, ...changes }],
        achievedGoalIds: new Set(),
        now: new Date(2026, 8, 10, 12, 0),
        locale: 'id',
      }),
    ).toEqual([]);
  });

  it('melewati Goal yang sudah tercapai', () => {
    expect(
      planGoalReminders({
        enabled: true,
        goals: [goal],
        achievedGoalIds: new Set(['goal-7']),
        now: new Date(2026, 8, 10, 8, 0),
        locale: 'id',
      }),
    ).toEqual([]);
  });

  it('menghasilkan ID yang stabil dan mengikuti locale', () => {
    const input = {
      enabled: true,
      goals: [goal],
      achievedGoalIds: new Set<string>(),
      now: new Date(2026, 8, 1, 8, 0),
      locale: 'en' as const,
    };
    const first = planGoalReminders(input);
    const second = planGoalReminders(input);

    expect(first.map((item) => item.identifier)).toEqual(second.map((item) => item.identifier));
    expect(first[0]?.body).toContain('Dana Darurat');
  });
});
