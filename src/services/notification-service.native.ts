import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import type * as NotificationsModule from 'expo-notifications';

import type {
  NotificationPermissionStatus,
  NotificationResponseSubscription,
  ReminderNotificationRequest,
  ScheduledReminderNotification,
} from './notification-service.types';

export type {
  NotificationPermissionStatus,
  NotificationResponseSubscription,
  ReminderNotificationRequest,
  ScheduledReminderNotification,
} from './notification-service.types';

type NotificationsApi = typeof NotificationsModule;

function isExpoGoAndroid() {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

let Notifications: NotificationsApi | null = null;
if (!isExpoGoAndroid()) {
  try {
    // Expo Go Android does not ship the native notification runtime used by this adapter.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications') as NotificationsApi;
  } catch {
    Notifications = null;
  }
}

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function normalizePermission(
  settings: NotificationsModule.NotificationPermissionsStatus,
): NotificationPermissionStatus {
  if (
    settings.granted ||
    settings.ios?.status === Notifications?.IosAuthorizationStatus.PROVISIONAL
  )
    return 'granted';
  if (settings.status === 'denied') return 'denied';
  return 'undetermined';
}

async function ensureReminderChannel() {
  if (Platform.OS !== 'android' || !Notifications) return;
  await Notifications.setNotificationChannelAsync('spen-reminders', {
    name: 'Pengingat Spen',
    importance: Notifications.AndroidImportance.LOW,
    vibrationPattern: [],
    sound: null,
  });
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (!Notifications) return 'unsupported';
  return normalizePermission(await Notifications.getPermissionsAsync());
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!Notifications) return 'unsupported';
  await ensureReminderChannel();
  const settings = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: false },
  });
  return normalizePermission(settings);
}

export async function cancelAllReminderNotifications(): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleReminderNotification(
  request: ReminderNotificationRequest,
): Promise<void> {
  if (!Notifications) return;
  await ensureReminderChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: request.identifier,
    content: {
      title: request.title,
      body: request.body,
      data: request.data,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: request.triggerAt,
      channelId: 'spen-reminders',
    },
  });
}

export async function getScheduledReminderNotifications(): Promise<
  ScheduledReminderNotification[]
> {
  if (!Notifications) return [];
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications.map((notification) => ({
    identifier: notification.identifier,
    data: notification.content.data ?? {},
  }));
}

export async function cancelReminderNotification(identifier: string): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export function addNotificationResponseListener(
  handler: (data: Record<string, unknown>) => void,
): NotificationResponseSubscription {
  if (!Notifications) return { remove: () => undefined };
  return Notifications.addNotificationResponseReceivedListener((response) => {
    handler(response.notification.request.content.data ?? {});
  });
}

export async function consumeLastNotificationResponseData(): Promise<Record<string, unknown> | null> {
  if (!Notifications) return null;
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  await Notifications.clearLastNotificationResponseAsync();
  return response.notification.request.content.data ?? {};
}

export async function openNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}
