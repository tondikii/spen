import { planTransactionReminders } from '@/features/reminders';

describe('ReminderPlanner', () => {
  const baseInput = {
    settings: {
      remindersEnabled: true,
      transactionReminderEnabled: true,
      transactionReminderTime: '20:00',
    },
    transactions: [],
    now: new Date(2026, 8, 9, 19, 30),
    locale: 'id' as const,
  };

  it('merencanakan maksimal satu Pengingat per hari pada horizon berikutnya', () => {
    const plan = planTransactionReminders(baseInput);

    expect(plan).toHaveLength(7);
    expect(plan[0]!).toMatchObject({
      identifier: 'spen:transaction-daily:2026-09-09',
      title: 'Catat transaksi',
      body: 'Belum ada catatan hari ini. Tambahkan transaksi sekarang.',
      data: {
        reminderKind: 'transaction-daily',
        route: '/create',
      },
    });
    expect(plan[0]!.triggerAt).toEqual(new Date(2026, 8, 9, 20, 0));
    expect(new Set(plan.map((item) => item.identifier)).size).toBe(plan.length);
  });

  it('melewati hari yang sudah punya transaksi dan waktu hari ini yang terlewat', () => {
    const plan = planTransactionReminders({
      ...baseInput,
      now: new Date(2026, 8, 9, 20, 1),
      transactions: [{ date: '2026-09-09' }, { date: '2026-09-11' }],
    });

    expect(plan.map((item) => item.identifier)).toEqual([
      'spen:transaction-daily:2026-09-10',
      'spen:transaction-daily:2026-09-12',
      'spen:transaction-daily:2026-09-13',
      'spen:transaction-daily:2026-09-14',
      'spen:transaction-daily:2026-09-15',
    ]);
  });

  it('mengikuti pergantian bulan pada kalender lokal', () => {
    const plan = planTransactionReminders({
      ...baseInput,
      now: new Date(2026, 8, 30, 19, 30),
    });

    expect(plan.slice(0, 3).map((item) => item.identifier)).toEqual([
      'spen:transaction-daily:2026-09-30',
      'spen:transaction-daily:2026-10-01',
      'spen:transaction-daily:2026-10-02',
    ]);
  });

  it('menghasilkan identitas yang sama saat rekonsiliasi diulang dan mengikuti locale', () => {
    const englishPlan = planTransactionReminders({ ...baseInput, locale: 'en' });
    const repeatedPlan = planTransactionReminders({ ...baseInput, locale: 'en' });

    expect(repeatedPlan.map((item) => item.identifier)).toEqual(
      englishPlan.map((item) => item.identifier),
    );
    expect(englishPlan[0]!).toMatchObject({
      title: 'Add a transaction',
      body: 'There is no record today. Add a transaction now.',
    });
  });

  it('merencanakan Pengingat berdasarkan waktu transaksi', () => {
    const plan = planTransactionReminders({
      ...baseInput,
      settings: {
        transactionReminderTime: baseInput.settings.transactionReminderTime,
      },
    });

    expect(plan).toHaveLength(7);
  });
});
