import { reconcileAllReminders } from '@/features/reminders';
import { getDatabaseActiveBudgetPeriod } from '@/features/plan';
import { getDatabaseGoals } from '@/features/goal';
import { getDatabaseSettings } from '@/features/settings';
import { getDatabaseTransactionsBetween } from '@/features/transactions';
import {
  getNotificationPermissionStatus,
  getScheduledReminderNotifications,
  scheduleReminderNotification,
} from '../data/notification-service';

jest.mock('@/features/plan', () => ({
  getDatabaseActiveBudgetPeriod: jest.fn(),
}));
jest.mock('@/features/goal', () => ({
  getDatabaseGoals: jest.fn(),
  getGoalProgress: jest.fn(),
}));
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

describe('reconcileAllReminders', () => {
  beforeEach(() => {
    jest.mocked(getDatabaseSettings).mockResolvedValue({
      currency: 'IDR',
      themeMode: 'light',
      locale: 'id',
      remindersEnabled: true,
      transactionReminderEnabled: true,
      periodReminderEnabled: true,
      goalReminderEnabled: true,
      transactionReminderTime: '20:00',
      notificationPermissionRequested: true,
    });
    jest.mocked(getScheduledReminderNotifications).mockResolvedValue([]);
    jest.mocked(getNotificationPermissionStatus).mockResolvedValue('granted');
    jest.mocked(getDatabaseTransactionsBetween).mockResolvedValue([]);
    jest.mocked(getDatabaseActiveBudgetPeriod).mockResolvedValue(null);
    jest.mocked(getDatabaseGoals).mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it('mere-konsiliasi transaksi, periode, dan Goal dari satu entry point', async () => {
    const result = await reconcileAllReminders({} as never, new Date(2026, 8, 9, 12, 0));

    expect(result.periods).toEqual([]);
    expect(result.goals).toEqual([]);
    expect(result.transactions.length).toBeGreaterThan(0);
    expect(getDatabaseSettings).toHaveBeenCalledTimes(3);
    expect(getNotificationPermissionStatus).toHaveBeenCalledTimes(3);
    expect(scheduleReminderNotification).toHaveBeenCalled();
  });
});
