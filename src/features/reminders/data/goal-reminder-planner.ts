import { shiftDate, todayISO } from '@/utils/date';
import { resources } from '@/i18n';
import type { Goal, Locale } from '@/types/domain';

export const GOAL_REMINDER_KIND = 'goal-deadline' as const;

export type GoalReminderPlan = {
  identifier: string;
  kind: typeof GOAL_REMINDER_KIND;
  title: string;
  body: string;
  triggerAt: Date;
  data: {
    reminderKind: typeof GOAL_REMINDER_KIND;
    reminderId: string;
    goalId: string;
    route: '/plan';
  };
};

export type GoalReminderPlannerInput = {
  enabled: boolean;
  goals: readonly Goal[];
  achievedGoalIds: ReadonlySet<string>;
  now?: Date;
  locale: Locale;
};

function localDateAtNine(date: string) {
  const [year = NaN, month = NaN, day = NaN] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 9, 0, 0, 0);
}

export function planGoalReminders({
  enabled,
  goals,
  achievedGoalIds,
  now = new Date(),
  locale,
}: GoalReminderPlannerInput): GoalReminderPlan[] {
  if (!enabled) return [];

  const today = todayISO(now);
  const copy = resources[locale].translation.common;
  return goals.flatMap((goal) => {
    if (goal.archived || !goal.targetDate || achievedGoalIds.has(goal.id)) return [];
    if (goal.targetDate <= today) return [];

    const sevenDaysBefore = shiftDate(goal.targetDate, -7);
    const reminderDate = sevenDaysBefore > today ? sevenDaysBefore : goal.targetDate;
    const triggerAt = localDateAtNine(reminderDate);
    if (triggerAt.getTime() <= now.getTime()) return [];

    const identifier = `spen:${GOAL_REMINDER_KIND}:${goal.id}:${reminderDate}`;
    return [
      {
        identifier,
        kind: GOAL_REMINDER_KIND,
        title: copy.goalDeadlineReminderTitle,
        body: copy.goalDeadlineReminderBody.replace('{{name}}', goal.name),
        triggerAt,
        data: {
          reminderKind: GOAL_REMINDER_KIND,
          reminderId: identifier,
          goalId: goal.id,
          route: '/plan',
        },
      },
    ];
  });
}
