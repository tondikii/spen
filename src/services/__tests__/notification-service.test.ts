import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import {
  cancelAllReminderNotifications,
  getNotificationPermissionStatus,
  openNotificationSettings,
  requestNotificationPermission,
} from '@/services/notification-service.native';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { LOW: 2 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
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
});
