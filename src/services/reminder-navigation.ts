export type ReminderRoute = '/create' | '/plan';

export function getReminderRoute(data: Record<string, unknown>): ReminderRoute | null {
  if (data.reminderKind === 'transaction-daily' && data.route === '/create') return '/create';
  if (data.reminderKind === 'budget-period' && data.route === '/plan') return '/plan';
  return null;
}
