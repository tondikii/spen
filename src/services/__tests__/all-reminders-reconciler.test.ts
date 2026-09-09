import { reconcileAllReminders } from '@/services/reminder-reconciler';
import { getDatabaseActiveBudgetPeriod } from '@/services/plan-service';
import { getDatabaseGoals } from '@/services/goal-service';
import { getDatabaseSettings } from '@/services/settings-service';
import { getDatabaseTransactions } from '@/services/transaction-service';
import {
  getNotificationPermissionStatus,
  getScheduledReminderNotifications,
  scheduleReminderNotification,
} from '@/services/notification-service';

jest.mock('@/services/plan-service', () => ({
  getDatabaseActiveBudgetPeriod: jest.fn(),
}));
jest.mock('@/services/goal-service', () => ({
  getDatabaseGoals: jest.fn(),
  getGoalProgress: jest.fn(),
}));
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
    jest.mocked(getDatabaseTransactions).mockResolvedValue([]);
    jest.mocked(getDatabaseActiveBudgetPeriod).mockResolvedValue(null);
    jest.mocked(getDatabaseGoals).mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  it('mere-konsiliasi transaksi, periode, dan Goal dari satu entry point', async () => {
    const result = await reconcileAllReminders(
      {} as never,
      new Date(2026, 8, 9, 12, 0),
    );

    expect(result.periods).toEqual([]);
    expect(result.goals).toEqual([]);
    expect(result.transactions.length).toBeGreaterThan(0);
    expect(getDatabaseSettings).toHaveBeenCalledTimes(3);
    expect(getNotificationPermissionStatus).toHaveBeenCalledTimes(3);
    expect(scheduleReminderNotification).toHaveBeenCalled();
  });
});
