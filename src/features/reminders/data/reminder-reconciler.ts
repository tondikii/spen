import type { SQLiteDatabase } from 'expo-sqlite';

import {
  cancelReminderNotification,
  getNotificationPermissionStatus,
  getScheduledReminderNotifications,
  scheduleReminderNotification,
} from './notification-service';
import { getDatabaseSettings } from '@/features/settings';
import { getDatabaseTransactionsBetween } from '@/features/transactions';
import { planTransactionReminders, TRANSACTION_REMINDER_KIND } from './reminder-planner';
import { getDatabaseActiveBudgetPeriod } from '@/features/plan';
import {
  BUDGET_PERIOD_REMINDER_KIND,
  planBudgetPeriodReminders,
} from './budget-period-reminder-planner';
import { todayISO } from '@/utils/date';
import { getDatabaseGoals, getGoalProgress } from '@/features/goal';
import { GOAL_REMINDER_KIND, planGoalReminders } from './goal-reminder-planner';

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

  if ((await getNotificationPermissionStatus()) !== 'granted') return [];

  const transactions = await getDatabaseTransactionsBetween(database, '0000-01-01', '9999-12-31');
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

export async function reconcileAllReminders(database: SQLiteDatabase, now = new Date()) {
  const [transactions, periods, goals] = await Promise.all([
    reconcileTransactionReminders(database, now),
    reconcileBudgetPeriodReminders(database, now),
    reconcileGoalReminders(database, now),
  ]);
  return { transactions, periods, goals };
}
