// Format file backup: skema baris per tabel snapshot, bentuk BackupPayload,
// serta konstanta versi dan batas keamanan. Murni deklarasi — tanpa akses DB.
export const BACKUP_VERSION = 1;

export type WalletRow = {
  id: number;
  name: string;
  initial_balance: number;
  is_savings: number;
  archived: number;
};
export type CategoryRow = {
  id: number;
  name: string;
  system_key?: string | null;
  type: string;
  is_adjustment: number;
  icon: string;
  archived: number;
};
export type TransactionRow = {
  id: number;
  type: string;
  wallet_id: number | null;
  to_wallet_id: number | null;
  category_id: number | null;
  amount: number;
  date: string;
  time: string;
  note: string | null;
  is_initial: number;
  admin_fee: number;
  source_income_item_id: number | null;
  source_expense_item_id: number | null;
};
export type BudgetPeriodRow = {
  id: number;
  start_date: string;
  end_date: string;
  duration_months: number;
};
export type BudgetPlanRow = { id: number; budget_period_id: number };
export type PlanItemRow = {
  id: number;
  budget_plan_id: number;
  name: string;
  category_id: number;
  target_amount: number;
  is_paid?: number;
};
export type GoalRow = {
  id: number;
  name: string;
  target_amount: number;
  target_date: string | null;
  wallet_id: number;
  monthly_contribution: number;
  archived: number;
};
export type SettingsRow = {
  id: number;
  currency: string;
  theme_mode: string;
  locale: string;
  budget_start_day: number;
  reminders_enabled?: number;
  transaction_reminder_enabled?: number;
  period_reminder_enabled?: number;
  goal_reminder_enabled?: number;
  transaction_reminder_time?: string;
  notification_permission_requested?: number;
};

export type BackupPayload = {
  version: number;
  exportedAt: string;
  data: {
    wallets: WalletRow[];
    categories: CategoryRow[];
    transactions: TransactionRow[];
    budgetPeriods: BudgetPeriodRow[];
    budgetPlans: BudgetPlanRow[];
    incomeItems: PlanItemRow[];
    fixedExpenseItems: PlanItemRow[];
    allocationItems: PlanItemRow[];
    expenseItems: PlanItemRow[];
    goals: GoalRow[];
    settings: SettingsRow[];
  };
};

/** Batas keamanan saat restore (panduan seksi 19): tolak file yang tidak wajar. */
export const BACKUP_MAX_JSON_LENGTH = 16_000_000;
export const BACKUP_MAX_RECORDS = 200_000;
