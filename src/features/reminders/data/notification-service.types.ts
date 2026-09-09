export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export type ReminderNotificationRequest = {
  identifier: string;
  title: string;
  body: string;
  triggerAt: Date;
  data: Record<string, unknown>;
};

export type ScheduledReminderNotification = {
  identifier: string;
  data: Record<string, unknown>;
};

export type NotificationResponseSubscription = { remove: () => void };
