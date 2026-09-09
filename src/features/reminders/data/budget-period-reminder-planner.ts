import { shiftDate } from '@/utils/date';
import { resources } from '@/i18n';
import type { Locale } from '@/types/domain';

export const BUDGET_PERIOD_REMINDER_KIND = 'budget-period' as const;

export type BudgetPeriodReminderPlan = {
  identifier: string;
  kind: typeof BUDGET_PERIOD_REMINDER_KIND;
  title: string;
  body: string;
  triggerAt: Date;
  data: {
    reminderKind: typeof BUDGET_PERIOD_REMINDER_KIND;
    reminderId: string;
    route: '/plan';
  };
};

type BudgetPeriod = {
  id: string;
  startDate: string;
  endDate: string;
};

export type BudgetPeriodReminderPlannerInput = {
  enabled: boolean;
  period: BudgetPeriod;
  now?: Date;
  locale: Locale;
};

function localDateAtTime(date: string, hour: number) {
  const [year = NaN, month = NaN, day = NaN] = date.split('-').map(Number);
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

export function planBudgetPeriodReminders({
  enabled,
  period,
  now = new Date(),
  locale,
}: BudgetPeriodReminderPlannerInput): BudgetPeriodReminderPlan[] {
  if (!enabled) return [];

  const copy = resources[locale].translation.common;
  const events = [
    {
      event: 'start' as const,
      date: period.startDate,
      hour: 9,
      title: copy.budgetPeriodReminderTitle,
      body: copy.budgetPeriodReminderBody,
    },
    {
      event: 'review' as const,
      date: shiftDate(period.endDate, -3),
      hour: 19,
      title: copy.budgetPeriodReviewReminderTitle,
      body: copy.budgetPeriodReviewReminderBody,
    },
  ];

  return events.flatMap(({ event, date, hour, title, body }) => {
    const triggerAt = localDateAtTime(date, hour);
    if (triggerAt.getTime() <= now.getTime()) return [];
    const identifier = `spen:${BUDGET_PERIOD_REMINDER_KIND}:${event}:${period.id}:${date}`;
    return [
      {
        identifier,
        kind: BUDGET_PERIOD_REMINDER_KIND,
        title,
        body,
        triggerAt,
        data: {
          reminderKind: BUDGET_PERIOD_REMINDER_KIND,
          reminderId: identifier,
          route: '/plan' as const,
        },
      },
    ];
  });
}
