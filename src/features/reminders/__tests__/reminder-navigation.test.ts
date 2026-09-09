import { getReminderRoute } from '@/features/reminders';

describe('getReminderRoute', () => {
  it('membuka pencatatan dari pengingat transaksi', () => {
    expect(getReminderRoute({ reminderKind: 'transaction-daily', route: '/create' })).toBe(
      '/create',
    );
  });

  it('membuka Rencana Anggaran dari pengingat periode', () => {
    expect(getReminderRoute({ reminderKind: 'budget-period', route: '/plan' })).toBe('/plan');
  });

  it('membuka Rencana dengan konteks Goal', () => {
    expect(
      getReminderRoute({ reminderKind: 'goal-deadline', goalId: 'goal-7', route: '/plan' }),
    ).toBe('/plan');
  });

  it('mengabaikan payload yang tidak dikenal', () => {
    expect(getReminderRoute({ reminderKind: 'budget-period', route: '/create' })).toBeNull();
    expect(getReminderRoute({ reminderKind: 'unknown', route: '/plan' })).toBeNull();
  });
});
