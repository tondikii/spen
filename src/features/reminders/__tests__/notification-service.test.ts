import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import {
  addNotificationResponseListener,
  cancelReminderNotification,
  cancelAllReminderNotifications,
  getScheduledReminderNotifications,
  getNotificationPermissionStatus,
  consumeLastNotificationResponseData,
  openNotificationSettings,
  requestNotificationPermission,
  scheduleReminderNotification,
} from '../data/notification-service.native';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { LOW: 2 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  cancelAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  clearLastNotificationResponseAsync: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

describe('notification service', () => {
  afterEach(() => jest.clearAllMocks());

  it('reports the current permission without prompting', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
      granted: false,
      status: 'undetermined',
    } as never);

    await expect(getNotificationPermissionStatus()).resolves.toBe('undetermined');
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('normalizes granted and provisional permissions', async () => {
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
      granted: true,
      status: 'granted',
    } as never);
    await expect(getNotificationPermissionStatus()).resolves.toBe('granted');

    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({
      granted: false,
      status: 'undetermined',
      ios: { status: Notifications.IosAuthorizationStatus.PROVISIONAL },
    } as never);
    await expect(getNotificationPermissionStatus()).resolves.toBe('granted');
  });

  it('requests quiet notification permission explicitly', async () => {
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({
      granted: true,
      status: 'granted',
    } as never);

    await expect(requestNotificationPermission()).resolves.toBe('granted');
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledWith({
      ios: { allowAlert: true, allowBadge: false, allowSound: false },
    });
  });

  it('exposes cancellation and device settings actions at the boundary', async () => {
    await cancelAllReminderNotifications();
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);

    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
    await openNotificationSettings();
    expect(openSettings).toHaveBeenCalledTimes(1);
  });

  it('schedules deterministic requests, reads them, cancels them, and forwards taps', async () => {
    const triggerAt = new Date(2026, 8, 9, 20, 0);
    jest.mocked(Notifications.scheduleNotificationAsync).mockResolvedValue('native-id');
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValue([
      {
        identifier: 'spen:transaction-daily:2026-09-09',
        content: { data: { reminderKind: 'transaction-daily' } },
      },
    ] as never);
    const responseListener = jest.fn().mockReturnValue({ remove: jest.fn() });
    jest
      .mocked(Notifications.addNotificationResponseReceivedListener)
      .mockImplementation(responseListener);

    await scheduleReminderNotification({
      identifier: 'spen:transaction-daily:2026-09-09',
      title: 'Catat transaksi',
      body: 'Belum ada catatan hari ini.',
      triggerAt,
      data: { reminderKind: 'transaction-daily', route: '/create' },
    });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'spen:transaction-daily:2026-09-09',
        trigger: expect.objectContaining({ date: triggerAt }),
      }),
    );

    await expect(getScheduledReminderNotifications()).resolves.toEqual([
      {
        identifier: 'spen:transaction-daily:2026-09-09',
        data: { reminderKind: 'transaction-daily' },
      },
    ]);
    await cancelReminderNotification('spen:transaction-daily:2026-09-09');
    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'spen:transaction-daily:2026-09-09',
    );

    const handler = jest.fn();
    addNotificationResponseListener(handler);
    const callback = responseListener.mock.calls[0][0];
    callback({ notification: { request: { content: { data: { route: '/create' } } } } });
    expect(handler).toHaveBeenCalledWith({ route: '/create' });
  });

  it('mengonsumsi response tap yang tertinggal saat cold start', async () => {
    jest.mocked(Notifications.getLastNotificationResponseAsync).mockResolvedValue({
      notification: { request: { content: { data: { route: '/create' } } } },
    } as never);

    await expect(consumeLastNotificationResponseData()).resolves.toEqual({ route: '/create' });
    expect(Notifications.clearLastNotificationResponseAsync).toHaveBeenCalledTimes(1);
  });
});
