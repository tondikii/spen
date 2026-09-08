export type PeriodRow = {
  id: number;
  start_date: string;
  end_date: string;
  duration_months: number;
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
export type ItemRow = {
  id: number;
  budget_plan_id: number;
  name: string;
  category_id: number;
  target_amount: number;
  is_paid?: number;
  wallet_id?: number | null;
};
export type WalletRow = {
  id: number;
  name: string;
  initial_balance: number;
  is_savings: number;
  archived: number;
  balance: number;
};
export type DatabaseTransactionRow = {
  id: number;
  type: 'income' | 'expense' | 'transfer' | 'adjustment';
  wallet_id: number | null;
  to_wallet_id: number | null;
  category_id: number | null;
  amount: number;
  date: string;
  time: string;
  note: string | null;
  admin_fee: number;
  is_initial: number;
  is_adjustment: number;
  source_income_item_id: number | null;
  source_expense_item_id: number | null;
};
