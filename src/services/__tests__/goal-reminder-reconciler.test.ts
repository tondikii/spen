import { reconcileGoalReminders } from '@/services/reminder-reconciler';
import { getDatabaseGoals, getGoalProgress } from '@/services/goal-service';
import { getDatabaseSettings } from '@/services/settings-service';
import {
  cancelReminderNotification,
  getNotificationPermissionStatus,
  getScheduledReminderNotifications,
  scheduleReminderNotification,
} from '@/services/notification-service';

jest.mock('@/services/goal-service', () => ({
  getDatabaseGoals: jest.fn(),
  getGoalProgress: jest.fn(),
}));
jest.mock('@/services/settings-service', () => ({
  getDatabaseSettings: jest.fn(),
}));
jest.mock('@/services/notification-service', () => ({
  cancelReminderNotification: jest.fn(),
  getNotificationPermissionStatus: jest.fn(),
  getScheduledReminderNotifications: jest.fn(),
  scheduleReminderNotification: jest.fn(),
}));

describe('Goal reminder reconciler', () => {
  const database = {} as never;
  const settings = {
    currency: 'IDR' as const,
    themeMode: 'light' as const,
    locale: 'id' as const,
    remindersEnabled: true,
    transactionReminderEnabled: false,
    periodReminderEnabled: false,
    goalReminderEnabled: true,
    transactionReminderTime: '20:00',
    notificationPermissionRequested: true,
  };
  const goal = {
    id: 'goal-7',
    name: 'Dana Darurat',
    targetAmount: 10_000_000,
    targetDate: '2026-09-20',
    walletId: 'wallet-2',
    monthlyContribution: 1_000_000,
    archived: false,
  };

  beforeEach(() => {
    jest.mocked(getDatabaseSettings).mockResolvedValue(settings);
    jest.mocked(getNotificationPermissionStatus).mockResolvedValue('granted');
    jest.mocked(getScheduledReminderNotifications).mockResolvedValue([
      {
        identifier: 'spen:goal-deadline:goal-old:2026-09-01',
        data: { reminderKind: 'goal-deadline' },
      },
      {
        identifier: 'spen:transaction-daily:2026-09-09',
        data: { reminderKind: 'transaction-daily' },
      },
    ]);
    jest.mocked(getDatabaseGoals).mockResolvedValue([goal]);
    jest.mocked(getGoalProgress).mockResolvedValue({
      goalId: goal.id,
      savedAmount: 0,
      progressPercent: 0,
      achieved: false,
    });
  });

  afterEach(() => jest.clearAllMocks());

  it('membatalkan jadwal lama dan menjadwalkan Goal aktif yang belum tercapai', async () => {
    const plan = await reconcileGoalReminders(database, new Date(2026, 8, 10, 8, 0));

    expect(cancelReminderNotification).toHaveBeenCalledWith(
      'spen:goal-deadline:goal-old:2026-09-01',
    );
    expect(cancelReminderNotification).toHaveBeenCalledTimes(1);
    expect(scheduleReminderNotification).toHaveBeenCalledTimes(1);
    expect(plan).toHaveLength(1);
  });

  it.each([
    ['toggle mati', { goalReminderEnabled: false }],
    ['Goal tercapai', null],
  ])('tidak menjadwalkan ketika %s', async (_label, override) => {
    if (override) jest.mocked(getDatabaseSettings).mockResolvedValue({ ...settings, ...override });
    else jest.mocked(getGoalProgress).mockResolvedValue({ ...await getGoalProgress(database, goal), achieved: true });

    await expect(
      reconcileGoalReminders(database, new Date(2026, 8, 10, 8, 0)),
    ).resolves.toEqual([]);
    expect(scheduleReminderNotification).not.toHaveBeenCalled();
  });

  it('aman direkonsiliasi ulang dan tidak menyentuh pengingat transaksi', async () => {
    await reconcileGoalReminders(database, new Date(2026, 8, 10, 8, 0));
    await reconcileGoalReminders(database, new Date(2026, 8, 10, 8, 0));

    expect(cancelReminderNotification).toHaveBeenCalledTimes(2);
    expect(scheduleReminderNotification).toHaveBeenCalledTimes(2);
  });
});
