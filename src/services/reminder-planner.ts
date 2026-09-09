import { todayISO } from '@/lib/date';
import { shiftDate } from '@/lib/calendar';
import { resources } from '@/i18n';
import type { Locale, ReminderSettings, Transaction } from '@/types/domain';

export const TRANSACTION_REMINDER_HORIZON_DAYS = 7;
export const TRANSACTION_REMINDER_KIND = 'transaction-daily' as const;

export type ReminderPlan = {
  identifier: string;
  kind: typeof TRANSACTION_REMINDER_KIND;
  title: string;
  body: string;
  triggerAt: Date;
  data: {
    reminderKind: typeof TRANSACTION_REMINDER_KIND;
    reminderId: string;
    route: '/create';
  };
};

type TransactionReminderSettings = Pick<
  ReminderSettings,
  'transactionReminderTime'
>;

export type TransactionReminderPlannerInput = {
  settings: TransactionReminderSettings;
  transactions: readonly Pick<Transaction, 'date'>[];
  now?: Date;
  locale: Locale;
};

function localDateAtTime(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function planTransactionReminders({
  settings,
  transactions,
  now = new Date(),
  locale,
}: TransactionReminderPlannerInput): ReminderPlan[] {
  const today = todayISO(now);
  const copy = resources[locale].translation.common;
  const transactionDates = new Set(transactions.map((transaction) => transaction.date));
  const plan: ReminderPlan[] = [];

  for (let offset = 0; offset < TRANSACTION_REMINDER_HORIZON_DAYS; offset += 1) {
    const date = shiftDate(today, offset);
    if (transactionDates.has(date)) continue;

    const triggerAt = localDateAtTime(date, settings.transactionReminderTime);
    if (triggerAt.getTime() <= now.getTime()) continue;

    const identifier = `spen:${TRANSACTION_REMINDER_KIND}:${date}`;
    plan.push({
      identifier,
      kind: TRANSACTION_REMINDER_KIND,
      title: copy.transactionReminderTitle,
      body: copy.transactionReminderBody,
      triggerAt,
      data: {
        reminderKind: TRANSACTION_REMINDER_KIND,
        reminderId: identifier,
        route: '/create',
      },
    });
  }

  return plan;
}
