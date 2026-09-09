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

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  return 'unsupported';
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  return 'unsupported';
}

export async function cancelAllReminderNotifications(): Promise<void> {}

export async function scheduleReminderNotification(
  _request: ReminderNotificationRequest,
): Promise<void> {}

export async function getScheduledReminderNotifications(): Promise<
  ScheduledReminderNotification[]
> {
  return [];
}

export async function cancelReminderNotification(_identifier: string): Promise<void> {}

export function addNotificationResponseListener(
  _handler: (data: Record<string, unknown>) => void,
): NotificationResponseSubscription {
  return { remove: () => undefined };
}

export async function consumeLastNotificationResponseData(): Promise<Record<string, unknown> | null> {
  return null;
}

export async function openNotificationSettings(): Promise<void> {}
