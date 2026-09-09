import { reconcileBudgetPeriodReminders } from '@/features/reminders';
import { getDatabaseActiveBudgetPeriod } from '@/features/plan';
import { getDatabaseSettings } from '@/features/settings';
import {
  cancelReminderNotification,
  getNotificationPermissionStatus,
  getScheduledReminderNotifications,
  scheduleReminderNotification,
} from '../data/notification-service';

jest.mock('@/features/plan', () => ({
  getDatabaseActiveBudgetPeriod: jest.fn(),
}));
jest.mock('@/features/settings', () => ({
  getDatabaseSettings: jest.fn(),
}));
jest.mock('../data/notification-service', () => ({
  cancelReminderNotification: jest.fn(),
  getNotificationPermissionStatus: jest.fn(),
  getScheduledReminderNotifications: jest.fn(),
  scheduleReminderNotification: jest.fn(),
}));

describe('Budget period reminder reconciler', () => {
  const database = {} as never;
  const settings = {
    currency: 'IDR' as const,
    themeMode: 'light' as const,
    locale: 'id' as const,
    remindersEnabled: true,
    transactionReminderEnabled: false,
    periodReminderEnabled: true,
    goalReminderEnabled: false,
    transactionReminderTime: '20:00',
    notificationPermissionRequested: true,
  };

  beforeEach(() => {
    jest.mocked(getDatabaseSettings).mockResolvedValue(settings);
    jest.mocked(getNotificationPermissionStatus).mockResolvedValue('granted');
    jest.mocked(getScheduledReminderNotifications).mockResolvedValue([
      {
        identifier: 'spen:budget-period:start:budget-period-old:2026-09-01',
        data: { reminderKind: 'budget-period' },
      },
      {
        identifier: 'spen:transaction-daily:2026-09-09',
        data: { reminderKind: 'transaction-daily' },
      },
    ]);
    jest.mocked(getDatabaseActiveBudgetPeriod).mockResolvedValue({
      id: 12,
      start_date: '2026-09-10',
      end_date: '2026-10-09',
      duration_months: 1,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('membatalkan jadwal periode lama dan menjadwalkan awal serta review periode aktif', async () => {
    const plan = await reconcileBudgetPeriodReminders(database, new Date(2026, 8, 9, 12, 0));

    expect(cancelReminderNotification).toHaveBeenCalledWith(
      'spen:budget-period:start:budget-period-old:2026-09-01',
    );
    expect(cancelReminderNotification).toHaveBeenCalledTimes(1);
    expect(scheduleReminderNotification).toHaveBeenCalledTimes(2);
    expect(plan).toHaveLength(2);
    expect(scheduleReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'spen:budget-period:start:budget-period-12:2026-09-10',
      }),
    );
  });

  it('tetap menjadwalkan ketika flag periode legacy mati', async () => {
    jest.mocked(getDatabaseSettings).mockResolvedValue({
      ...settings,
      periodReminderEnabled: false,
    });

    await reconcileBudgetPeriodReminders(database, new Date(2026, 8, 9, 12, 0));

    expect(getDatabaseActiveBudgetPeriod).toHaveBeenCalledTimes(1);
    expect(scheduleReminderNotification).toHaveBeenCalledTimes(2);
  });

  it('aman dijalankan berulang untuk mengganti jadwal tanpa duplikat', async () => {
    await reconcileBudgetPeriodReminders(database, new Date(2026, 8, 9, 12, 0));
    await reconcileBudgetPeriodReminders(database, new Date(2026, 8, 9, 12, 0));

    expect(cancelReminderNotification).toHaveBeenCalledTimes(2);
    expect(scheduleReminderNotification).toHaveBeenCalledTimes(4);
  });
});
