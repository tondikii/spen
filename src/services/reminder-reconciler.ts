import type { SQLiteDatabase } from 'expo-sqlite';

import {
  cancelReminderNotification,
  getNotificationPermissionStatus,
  getScheduledReminderNotifications,
  scheduleReminderNotification,
} from '@/services/notification-service';
import { getDatabaseSettings } from '@/services/settings-service';
import { getDatabaseTransactions } from '@/services/transaction-service';
import { planTransactionReminders, TRANSACTION_REMINDER_KIND } from '@/services/reminder-planner';

export async function reconcileTransactionReminders(database: SQLiteDatabase, now = new Date()) {
  const [settings, scheduled] = await Promise.all([
    getDatabaseSettings(database),
    getScheduledReminderNotifications(),
  ]);

  await Promise.all(
    scheduled
      .filter((notification) => notification.data.reminderKind === TRANSACTION_REMINDER_KIND)
      .map((notification) => cancelReminderNotification(notification.identifier)),
  );

  if (!settings.remindersEnabled || !settings.transactionReminderEnabled) return [];
  if ((await getNotificationPermissionStatus()) !== 'granted') return [];

  const transactions = await getDatabaseTransactions(database);
  const plan = planTransactionReminders({
    settings,
    transactions,
    now,
    locale: settings.locale === 'id' ? 'id' : 'en',
  });
  await Promise.all(plan.map((reminder) => scheduleReminderNotification(reminder)));
  return plan;
}
