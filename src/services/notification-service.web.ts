export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  return 'unsupported';
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  return 'unsupported';
}

export async function cancelAllReminderNotifications(): Promise<void> {}

export async function openNotificationSettings(): Promise<void> {}
