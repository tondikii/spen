import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

function normalizePermission(
  settings: Notifications.NotificationPermissionsStatus,
): NotificationPermissionStatus {
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL)
    return 'granted';
  if (settings.status === 'denied') return 'denied';
  return 'undetermined';
}

async function ensureReminderChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('spen-reminders', {
    name: 'Pengingat Spen',
    importance: Notifications.AndroidImportance.LOW,
    vibrationPattern: [],
    sound: null,
  });
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  return normalizePermission(await Notifications.getPermissionsAsync());
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  await ensureReminderChannel();
  const settings = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: false },
  });
  return normalizePermission(settings);
}

export async function cancelAllReminderNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function openNotificationSettings(): Promise<void> {
  await Linking.openSettings();
}
