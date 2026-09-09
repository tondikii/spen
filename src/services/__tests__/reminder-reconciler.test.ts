import { reconcileTransactionReminders } from '@/services/reminder-reconciler';
import { getDatabaseSettings } from '@/services/settings-service';
import { getDatabaseTransactions } from '@/services/transaction-service';
import {
  cancelReminderNotification,
  getNotificationPermissionStatus,
  getScheduledReminderNotifications,
  scheduleReminderNotification,
} from '@/services/notification-service';

jest.mock('@/services/settings-service', () => ({
  getDatabaseSettings: jest.fn(),
}));
jest.mock('@/services/transaction-service', () => ({
  getDatabaseTransactions: jest.fn(),
}));
jest.mock('@/services/notification-service', () => ({
  cancelReminderNotification: jest.fn(),
  getNotificationPermissionStatus: jest.fn(),
  getScheduledReminderNotifications: jest.fn(),
  scheduleReminderNotification: jest.fn(),
}));

describe('ReminderReconciler', () => {
  const database = {} as never;
  const settings = {
    currency: 'IDR' as const,
    themeMode: 'light' as const,
    locale: 'id' as const,
    remindersEnabled: true,
    transactionReminderEnabled: true,
    periodReminderEnabled: false,
    goalReminderEnabled: false,
    transactionReminderTime: '20:00',
    notificationPermissionRequested: true,
  };

  beforeEach(() => {
    jest.mocked(getDatabaseSettings).mockResolvedValue(settings);
    jest.mocked(getDatabaseTransactions).mockResolvedValue([]);
    jest.mocked(getNotificationPermissionStatus).mockResolvedValue('granted');
    jest.mocked(getScheduledReminderNotifications).mockResolvedValue([
      {
        identifier: 'spen:transaction-daily:2026-09-08',
        data: { reminderKind: 'transaction-daily' },
      },
      {
        identifier: 'spen:budget-period:2026-09-10',
        data: { reminderKind: 'budget-period' },
      },
    ]);
  });

  afterEach(() => jest.clearAllMocks());

  it('membatalkan jadwal transaksi lama lalu menjadwalkan plan baru tanpa duplikasi', async () => {
    const plan = await reconcileTransactionReminders(database, new Date(2026, 8, 9, 19, 30));

    expect(cancelReminderNotification).toHaveBeenCalledWith(
      'spen:transaction-daily:2026-09-08',
    );
    expect(cancelReminderNotification).toHaveBeenCalledTimes(1);
    expect(scheduleReminderNotification).toHaveBeenCalledTimes(7);
    expect(plan).toHaveLength(7);
    expect(scheduleReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'spen:transaction-daily:2026-09-09' }),
    );
  });

  it('hanya membatalkan jadwal saat Pengingat transaksi tidak aktif', async () => {
    jest.mocked(getDatabaseSettings).mockResolvedValue({
      ...settings,
      transactionReminderEnabled: false,
    });

    await expect(
      reconcileTransactionReminders(database, new Date(2026, 8, 9, 19, 30)),
    ).resolves.toEqual([]);
    expect(cancelReminderNotification).toHaveBeenCalledTimes(1);
    expect(scheduleReminderNotification).not.toHaveBeenCalled();
  });

  it('tidak menjadwalkan saat izin native tidak tersedia', async () => {
    jest.mocked(getNotificationPermissionStatus).mockResolvedValue('denied');

    await reconcileTransactionReminders(database, new Date(2026, 8, 9, 19, 30));

    expect(scheduleReminderNotification).not.toHaveBeenCalled();
  });

  it('mengganti jadwal lama saat jam Pengingat berubah', async () => {
    jest.mocked(getDatabaseSettings).mockResolvedValue({
      ...settings,
      transactionReminderTime: '21:00',
    });

    await reconcileTransactionReminders(database, new Date(2026, 8, 9, 19, 30));

    expect(cancelReminderNotification).toHaveBeenCalledWith(
      'spen:transaction-daily:2026-09-08',
    );
    expect(scheduleReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'spen:transaction-daily:2026-09-09',
        triggerAt: new Date(2026, 8, 9, 21, 0),
      }),
    );
  });
});
