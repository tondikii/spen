import { reconcileTransactionReminders } from '@/features/reminders';
import { getDatabaseSettings } from '@/features/settings';
import { getDatabaseTransactionsBetween } from '@/features/transactions';
import {
  cancelReminderNotification,
  getNotificationPermissionStatus,
  getScheduledReminderNotifications,
  scheduleReminderNotification,
} from '../data/notification-service';

jest.mock('@/features/settings', () => ({
  getDatabaseSettings: jest.fn(),
}));
jest.mock('@/features/transactions', () => ({
  getDatabaseTransactionsBetween: jest.fn(),
}));
jest.mock('../data/notification-service', () => ({
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
    jest.mocked(getDatabaseTransactionsBetween).mockResolvedValue([]);
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

    expect(cancelReminderNotification).toHaveBeenCalledWith('spen:transaction-daily:2026-09-08');
    expect(cancelReminderNotification).toHaveBeenCalledTimes(1);
    expect(scheduleReminderNotification).toHaveBeenCalledTimes(7);
    expect(plan).toHaveLength(7);
    expect(scheduleReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'spen:transaction-daily:2026-09-09' }),
    );
  });

  it('tetap menjadwalkan saat flag transaksi legacy mati', async () => {
    jest.mocked(getDatabaseSettings).mockResolvedValue({
      ...settings,
      transactionReminderEnabled: false,
    });

    await reconcileTransactionReminders(database, new Date(2026, 8, 9, 19, 30));

    expect(cancelReminderNotification).toHaveBeenCalledTimes(1);
    expect(scheduleReminderNotification).toHaveBeenCalledTimes(7);
  });

  it('tetap menjadwalkan saat flag master legacy mati', async () => {
    jest.mocked(getDatabaseSettings).mockResolvedValue({
      ...settings,
      remindersEnabled: false,
    });

    await reconcileTransactionReminders(database, new Date(2026, 8, 9, 19, 30));

    expect(cancelReminderNotification).toHaveBeenCalledTimes(1);
    expect(scheduleReminderNotification).toHaveBeenCalledTimes(7);
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

    expect(cancelReminderNotification).toHaveBeenCalledWith('spen:transaction-daily:2026-09-08');
    expect(scheduleReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'spen:transaction-daily:2026-09-09',
        triggerAt: new Date(2026, 8, 9, 21, 0),
      }),
    );
  });
});
