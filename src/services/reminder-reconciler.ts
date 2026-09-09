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
import { getDatabaseActiveBudgetPeriod } from '@/services/plan-service';
import {
  BUDGET_PERIOD_REMINDER_KIND,
  planBudgetPeriodReminders,
} from '@/services/budget-period-reminder-planner';
import { todayISO } from '@/lib/date';
import { getDatabaseGoals, getGoalProgress } from '@/services/goal-service';
import { GOAL_REMINDER_KIND, planGoalReminders } from '@/services/goal-reminder-planner';

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

export async function reconcileBudgetPeriodReminders(database: SQLiteDatabase, now = new Date()) {
  const [settings, scheduled] = await Promise.all([
    getDatabaseSettings(database),
    getScheduledReminderNotifications(),
  ]);

  await Promise.all(
    scheduled
      .filter((notification) => notification.data.reminderKind === BUDGET_PERIOD_REMINDER_KIND)
      .map((notification) => cancelReminderNotification(notification.identifier)),
  );

  if (!settings.remindersEnabled || !settings.periodReminderEnabled) return [];
  if ((await getNotificationPermissionStatus()) !== 'granted') return [];

  const period = await getDatabaseActiveBudgetPeriod(database, todayISO(now));
  if (!period) return [];
  const plan = planBudgetPeriodReminders({
    enabled: true,
    period: {
      id: `budget-period-${period.id}`,
      startDate: period.start_date,
      endDate: period.end_date,
    },
    now,
    locale: settings.locale === 'id' ? 'id' : 'en',
  });
  await Promise.all(plan.map((reminder) => scheduleReminderNotification(reminder)));
  return plan;
}

export async function reconcileGoalReminders(database: SQLiteDatabase, now = new Date()) {
  const [settings, scheduled] = await Promise.all([
    getDatabaseSettings(database),
    getScheduledReminderNotifications(),
  ]);

  await Promise.all(
    scheduled
      .filter((notification) => notification.data.reminderKind === GOAL_REMINDER_KIND)
      .map((notification) => cancelReminderNotification(notification.identifier)),
  );

  if (!settings.remindersEnabled || !settings.goalReminderEnabled) return [];
  if ((await getNotificationPermissionStatus()) !== 'granted') return [];

  const goals = await getDatabaseGoals(database);
  const progress = await Promise.all(goals.map((goal) => getGoalProgress(database, goal)));
  const plan = planGoalReminders({
    enabled: true,
    goals,
    achievedGoalIds: new Set(progress.filter((item) => item.achieved).map((item) => item.goalId)),
    now,
    locale: settings.locale === 'id' ? 'id' : 'en',
  });
  await Promise.all(plan.map((reminder) => scheduleReminderNotification(reminder)));
  return plan;
}
